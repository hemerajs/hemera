'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Module Dependencies
 */

const EventEmitter = require('events')
const Bloomrun = require('bloomrun')
const Errio = require('errio')
const Heavy = require('heavy')
const _ = require('lodash')
const Pino = require('pino')
const TinySonic = require('tinysonic')
const SuperError = require('super-error')
const Joi = require('joi')
const Avvio = require('avvio')
const Hoek = require('hoek')
const Series = require('fastseries')

const Errors = require('./errors')
const Constants = require('./constants')
const Util = require('./util')
const NatsTransport = require('./transport')
const DefaultExtensions = require('./extensions')
const DefaultEncoder = require('./encoder')
const DefaultDecoder = require('./decoder')
const ServerResponse = require('./serverResponse')
const ServerRequest = require('./serverRequest')
const ClientRequest = require('./clientRequest')
const ClientResponse = require('./clientResponse')
const Serializers = require('./serializer')
const ConfigScheme = require('./configScheme')
const CodecPipeline = require('./codecPipeline')
const Reply = require('./reply')
const Add = require('./add')
const Extension = require('./extension')
const pDefer = require('p-defer')

/**
 * @class Hemera
 */
class Hemera extends EventEmitter {
  /**
   * Creates an instance of Hemera
   *
   * @param {Nats} transport
   * @param {Config} params
   *
   * @memberOf Hemera
   */
  constructor(transport, params) {
    super()

    const config = Joi.validate(params || {}, ConfigScheme)
    if (config.error) {
      throw config.error
    }

    this._config = config.value
    this._router = Bloomrun(this._config.bloomrun)
    this._heavy = new Heavy(this._config.load.process)
    this._transport = new NatsTransport({
      transport
    })
    this._topics = {}
    this.plugin$ = {
      name: 'core',
      options: {}
    }

    // special variables for the new execution context
    this.context$ = {}
    this.meta$ = {}
    this.delegate$ = {}
    this.auth$ = {}
    this.trace$ = {}
    this.request$ = {
      parentId: '',
      type: Constants.REQUEST_TYPE_REQUEST,
      id: ''
    }

    // client and server locales
    this._shouldCrash = false
    this._topic = ''
    this._replyTo = ''
    this._request = null
    this._response = null
    this._pattern = null
    this._actMeta = null
    this._actCallback = null
    this._execute = null
    this._cleanPattern = ''
    this._plugins = {
      core: this
    }

    // keep reference to root hemera instance
    this._root = this

    this._encoderPipeline = new CodecPipeline().add(DefaultEncoder.encode)
    this._decoderPipeline = new CodecPipeline().add(DefaultDecoder.decode)

    // errio settings
    Errio.setDefaults(this._config.errio)

    // Register all default hemera errors
    this._registerErrors()

    // create load policy
    this._loadPolicy = this._heavy.policy(this._config.load.policy)

    // start tracking process stats
    this._heavy.start()

    this._ext = new Extension()
    this._ext.add('onClientPreRequest', DefaultExtensions.onClientPreRequest)
    this._ext.add('onClientPostRequest', DefaultExtensions.onClientPostRequest)
    this._ext.add('onServerPreRequest', DefaultExtensions.onServerPreRequest)
    this._ext.add('onServerPreHandler', DefaultExtensions.onServerPreHandler)
    this._ext.add('onServerPreResponse', DefaultExtensions.onServerPreResponse)

    this._avvio = Avvio(this, {
      expose: {
        use: 'register',
        close: 'shutdown',
        onClose: 'onShutdown',
        ready: 'bootstrap'
      }
    })

    this._avvio.override = (hemera, plugin, opts) => {
      const res = Object.create(hemera)
      const proto = Object.getPrototypeOf(res)
      const pluginCount = Object.keys(this._plugins).length + 1
      const pluginName =
        plugin[Symbol.for('name')] || 'anonymous-' + pluginCount
      const pluginDeps = plugin[Symbol.for('dependencies')] || []

      if (hemera._config.childLogger) {
        res.log = hemera.log.child({ plugin: pluginName })
      }

      // plugin seperated prototype propertys
      res.plugin$ = {
        options: opts,
        name: pluginName,
        dependencies: pluginDeps
      }

      // extend prototype so that each nested plugin have access
      res.decorate = function decorate(prop, value, deps) {
        if (prop in this) {
          throw new Errors.HemeraError(Constants.DECORATION_ALREADY_DEFINED)
        }

        if (deps) {
          res._checkDecoraterDependencies(deps)
        }

        // extend prototype
        proto[prop] = value
      }

      this._plugins[pluginName] = res

      return res
    }

    this._series = Series()

    // use own logger
    if (this._config.logger) {
      this.log = this._config.logger
    } else {
      if (this._config.prettyLog) {
        let pretty = Pino.pretty()
        this.log = Pino(
          {
            name: this._config.name,
            safe: true, // avoid error caused by circular references
            level: this._config.logLevel,
            serializers: Serializers
          },
          pretty
        )

        // Leads to too much listeners in tests
        if (this._config.logLevel !== 'silent') {
          pretty.pipe(process.stdout)
        }
      } else {
        this.log = Pino({
          name: this._config.name,
          safe: true,
          level: this._config.logLevel,
          serializers: Serializers
        })
      }
    }
  }

  /**
   *
   *
   * @memberof Hemera
   */
  _registerErrors() {
    for (var error in Hemera.errors) {
      Errio.register(Hemera.errors[error])
    }
  }
  /**
   *
   *
   * @readonly
   * @memberof Hemera
   */
  get decoder() {
    return this._decoderPipeline
  }

  /**
   *
   *
   * @readonly
   * @memberof Hemera
   */
  get encoder() {
    return this._encoderPipeline
  }

  /**
   * Return the bloomrun instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get router() {
    return this._router
  }

  /**
   * Return the heavy instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get load() {
    return this._heavy.load
  }

  /**
   * Return the underlying NATS driver
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get transport() {
    return this._transport.driver
  }

  /**
   * Return all registered topics
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get topics() {
    return this._topics
  }

  /**
   *
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get config() {
    return this._config
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Hemera
   */
  get errorDetails() {
    if (this._isServer) {
      return {
        app: this._config.name,
        isServer: this._isServer,
        pattern: this.trace$.method
      }
    } else {
      return {
        app: this._config.name,
        isServer: this._isServer,
        pattern: this.trace$.method
      }
    }
  }

  /**
   * Return all hemera errors
   *
   * @readonly
   * @static
   *
   * @memberOf Hemera
   */
  static get errors() {
    return Errors
  }

  /**
   * Create a custom super error object without to start hemera
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  static createError(name) {
    const ctor = SuperError.subclass(name)
    // Register the class with Errio.
    Errio.register(ctor)
    return ctor
  }

  /**
   * Add an extension. Extensions are called in serie
   *
   * @param {any} type
   * @param {any} handler
   *
   * @memberOf Hemera
   */
  ext(type, handler) {
    if (type === 'onClose') {
      this.onShutdown(handler)
    } else {
      this._ext.add(type, handler)
    }
  }

  /**
   *
   *
   * @readonly
   * @memberof Hemera
   */
  get plugins() {
    return this._plugins
  }

  /**
   * Change the current plugin configuration
   * e.g to set the payload validator
   *
   * @param {any} options
   *
   * @memberOf Hemera
   */
  setOption(key, value) {
    this.plugin$.options[key] = value
  }

  /**
   * Change the base configuration.
   *
   *
   * @memberOf Hemera
   */
  setConfig(key, value) {
    this._config[key] = value
  }

  /**
   * Return the root instance
   *
   * @returns
   * @memberof Hemera
   */
  root() {
    return this._root
  }

  /**
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal() {
    process.exit(1)
  }

  /**
   *
   *
   * @param {any} prop
   * @returns
   * @memberof Hemera
   */
  hasDecorator(prop) {
    return prop in this
  }

  /**
   * Decorate the root instance
   * Value is globaly accessible
   *
   * @param {any} prop
   * @param {any} value
   *
   * @memberOf Hemera
   */
  decorate(prop, value, deps) {
    if (this[prop]) {
      throw new Errors.HemeraError(Constants.DECORATION_ALREADY_DEFINED)
    }

    if (deps) {
      this._checkDecoraterDependencies(deps)
    }

    this[prop] = value
  }

  /**
   *
   *
   * @param {any} deps
   * @memberof Hemera
   */
  _checkDecoraterDependencies(deps) {
    for (var i = 0; i < deps.length; i++) {
      if (!(deps in this)) {
        throw new Error(Constants.MISSING_DECORATE_DEPENDENCY)
      }
    }
  }
  /**
   *
   *
   * @param {any} deps
   * @memberof Hemera
   */
  checkPluginDependencies(plugin) {
    const deps = plugin[Symbol.for('dependencies')]
    if (!deps) return
    if (!Array.isArray(deps)) {
      throw new Error(Constants.PLUGIN_DEP_STRINGS)
    }

    deps.forEach(dependency => {
      if (!this._plugins[dependency]) {
        throw new Error(
          `The dependency '${dependency}' was not registered before plugin '${
            this.plugin$.name
          }'`
        )
      }
    })
  }

  /**
   *
   *
   * @param {any} plugin
   * @param {any} opts
   * @memberof Hemera
   */
  _use(plugin, opts) {
    let pluginOpts = Hoek.clone(plugin[Symbol.for('options')] || {})
    pluginOpts = Object.assign(pluginOpts, opts)
    this.register(plugin, pluginOpts)
  }

  /**
   *
   *
   * @param {any} plugin
   * @returns
   * @memberof Hemera
   */
  use(plugins, opts) {
    const p = _.isArray(plugins) ? plugins : [plugins]
    p.forEach(plugin => {
      this._use(plugin, opts)
    })
    return this._avvio
  }

  /**
   * Create a custom super error object in a running hemera instance
   *
   * @param {any} name
   * @returns
   *
   * @memberOf Hemera
   */
  createError(name) {
    const ctor = SuperError.subclass(name)
    // Register the class with Errio.
    Errio.register(ctor)
    return ctor
  }

  /**
   *
   *
   * @param {Function} cb
   *
   * @memberOf Hemera
   */
  ready(cb) {
    this._transport.driver.on('error', err => {
      this.log.error(err, Constants.NATS_TRANSPORT_ERROR)
      this.log.error("NATS Code: '%s', Message: %s", err.code, err.message)

      // Exit only on connection issues.
      // Authorization and protocol issues don't lead to process termination
      if (Constants.NATS_CONN_ERROR_CODES.indexOf(err.code) > -1) {
        // We have no NATS connection and can only gracefully shutdown hemera
        this.close()
      }
    })

    this._transport.driver.on('permission_error', err => {
      this.log.error(err, Constants.NATS_PERMISSION_ERROR)
    })

    this._transport.driver.on('reconnect', () => {
      this.log.info(Constants.NATS_TRANSPORT_RECONNECTED)
    })

    this._transport.driver.on('reconnecting', () => {
      this.log.warn(Constants.NATS_TRANSPORT_RECONNECTING)
    })

    this._transport.driver.on('disconnect', () => {
      this.log.warn(Constants.NATS_TRANSPORT_DISCONNECTED)
    })

    this._transport.driver.on('close', () => {
      this.log.warn(Constants.NATS_TRANSPORT_CLOSED)
    })

    this._transport.driver.on('connect', () => {
      this.log.info(Constants.NATS_TRANSPORT_CONNECTED)
      this.bootstrap(err => {
        if (_.isFunction(cb)) {
          cb(err)
        }
      })
    })
  }

  /**
   *
   *
   * @static
   * @param {any} fn
   * @param {any} cb
   * @memberof Hemera
   */
  _serverExtIterator(fn, cb) {
    const ret = fn(this, this._request, this._reply, cb)
    if (ret && typeof ret.then === 'function') {
      ret.then(cb).catch(cb)
    }
  }

  /**
   * Last step before the response is send to the callee.
   * The preResponse extension is dispatched and previous errors are evaluated.
   *
   * @memberOf Hemera
   */
  finish() {
    const self = this

    self._series(
      self,
      self._serverExtIterator,
      self._ext['onServerPreResponse'],
      err => self._onServerPreResponseCompleted(err)
    )
  }

  /**
   *
   *
   * @param {any} extensionError
   * @memberof Hemera
   */
  _onServerPreResponseCompleted(extensionError) {
    const self = this
    // check if any error was set before
    if (extensionError) {
      self._reply.error = self._attachHops(extensionError)
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.emit('serverResponseError', extensionError)
    }

    const result = self._createMessage()
    self._send(result)
  }

  /**
   *
   *
   * @param {any} msg
   * @memberof Hemera
   */
  _send(msg) {
    const self = this

    // indicates that an error occurs and that the program should exit
    if (self._shouldCrash) {
      // only when we have an inbox othwerwise exit the service immediately
      if (self._replyTo) {
        // send error back to callee
        self._transport.send(self._replyTo, msg, () => {
          // let it crash
          if (self._config.crashOnFatal) {
            self.fatal()
          }
        })
        return
      } else if (self._config.crashOnFatal) {
        self.fatal()
        return
      }
    }

    // reply only when we have an inbox
    if (self._replyTo) {
      self._transport.send(self._replyTo, msg)
    }
  }

  /**
   *
   *
   * @param {any} err
   * @returns
   * @memberof Hemera
   */
  _createMessage() {
    const self = this

    let message = {
      meta: self.meta$ || {},
      trace: self.trace$ || {},
      request: self.request$,
      result: self._reply.error ? null : self._reply.payload,
      error: self._reply.error ? Errio.toObject(self._reply.error) : null
    }

    let m = self._encoderPipeline.run(message, self)

    // attach encoding issues
    if (m.error) {
      let internalError = new Errors.ParseError(
        Constants.PAYLOAD_PARSING_ERROR
      ).causedBy(m.error)
      message.error = Errio.toObject(internalError)
      message.result = null
      // Retry to encode with issue perhaps the reason was data related
      m = self._encoderPipeline.run(message, self)
      self.log.error(internalError)
      self.emit('serverResponseError', m.error)
    }

    return m.value
  }
  /**
   *
   *
   * @param {any} err
   * @returns
   * @memberof Hemera
   */
  _attachHops(err) {
    const self = this

    if (err) {
      const errorDetails = {
        service: self.trace$.service,
        method: self.trace$.method,
        app: self._config.name,
        ts: Util.nowHrTime()
      }

      // collect hops
      if (err.hops) {
        err.hops.push(errorDetails)
      } else {
        err.hops = [errorDetails]
      }
    }

    return err
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} resp
   * @returns
   *
   * @memberof Hemera
   */
  _actionHandler(err, resp) {
    const self = this

    if (err) {
      self._reply.error = self.getRootError(err)
      self._reply.error = self._attachHops(self._reply.error)

      self.finish()
      return
    }

    // set only when we have a result and the reply interface wasn't called
    if (resp !== undefined && !self._reply.sent) {
      self._reply.payload = resp
    }

    self.finish()
  }

  /**
   *  Attach one handler to the topic subscriber.
   *  With subToMany and maxMessages you control NATS specific behaviour.
   *
   * @param {any} addDefinition
   * @memberof Hemera
   */
  subscribe(addDefinition) {
    const self = this

    const topic = addDefinition.actMeta.transport.topic
    const maxMessages = addDefinition.actMeta.transport.maxMessages
    const queue = addDefinition.actMeta.transport.queue
    const pubsub = addDefinition.actMeta.transport.pubsub
    const queueGroup = queue || `${Constants.NATS_QUEUEGROUP_PREFIX}.${topic}`

    // avoid duplicate subscribers of the emit stream
    // we use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    let handler = (request, replyTo) => {
      // create new execution context
      let hemera = self.createContext()
      hemera._topic = topic
      hemera._replyTo = replyTo
      hemera._request = new ServerRequest(request)
      hemera._response = new ServerResponse()
      hemera._reply = new Reply(hemera._request, hemera._response, hemera.log)
      hemera._pattern = {}
      hemera._actMeta = {}
      hemera._isServer = true

      hemera._series(
        hemera,
        hemera._serverExtIterator,
        hemera._ext['onServerPreRequest'],
        err => hemera._onServerPreRequestCompleted(err)
      )
    }

    // standard pubsub with optional max proceed messages
    if (pubsub) {
      self._topics[topic] = self._transport.subscribe(
        topic,
        {
          max: maxMessages
        },
        handler
      )
    } else {
      // queue group names allow load balancing of services
      self._topics[topic] = self._transport.subscribe(
        topic,
        {
          queue: queueGroup,
          max: maxMessages
        },
        handler
      )
    }
  }

  /**
   *
   * @param {any} extensionError
   * @param {any} value
   * @memberof Hemera
   */
  _onServerPreRequestCompleted(extensionError) {
    const self = this

    // check if any error was set before
    if (extensionError) {
      self._reply.error = self._attachHops(extensionError)
      self.emit('serverResponseError', extensionError)
      self.finish()
      return
    }

    // check if a handler is registered with this pattern
    if (self._actMeta) {
      self._series(
        self,
        self._serverExtIterator,
        self._ext['onServerPreHandler'],
        err => self._onServerPreHandlerCompleted(err)
      )
    } else {
      const internalError = new Errors.PatternNotFound(
        Constants.PATTERN_NOT_FOUND,
        self.errorDetails
      )
      self.log.error(internalError)
      self._reply.error = internalError
      self.emit('serverResponseError', self._reply.error)

      // send error back to callee
      self.finish()
    }
  }

  /**
   *
   *
   * @param {any} extensionError
   * @memberof Hemera
   */
  _onServerPreHandlerCompleted(extensionError) {
    const self = this

    // check if any error was set before
    if (extensionError) {
      self._reply.error = self._attachHops(extensionError)

      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.emit('serverResponseError', self._reply.error)
      self.finish()
      return
    }

    try {
      let action = self._actMeta.action.bind(self)

      self._actMeta.run(self._request, self._reply, err => {
        if (err) {
          self._reply.error = err
          const internalError = new Errors.HemeraError(
            Constants.ADD_MIDDLEWARE_ERROR,
            self.errorDetails
          ).causedBy(err)
          self.log.error(internalError)
          self.emit('serverResponseError', self._reply.error)
          self.finish()
          return
        }

        // if request type is 'pubsub' we dont have to reply back
        if (
          self._request.payload.request.type === Constants.REQUEST_TYPE_PUBSUB
        ) {
          action(self._request.payload.pattern)
          self.finish()
          return
        }

        // when we have 2 arguments defined we expect to use the callback style
        if (action.length === 2) {
          action(self._request.payload.pattern, (err, result) =>
            self._actionHandler(err, result)
          )
        } else {
          let result = action(self._request.payload.pattern)
          const isPromise = result && typeof result.then === 'function'

          if (isPromise) {
            result
              .then(x => self._actionHandler(null, x))
              .catch(e => self._actionHandler(e))
          } else {
            if (result instanceof Error) {
              self._actionHandler(result)
            } else {
              self._actionHandler(null, result)
            }
          }
        }
      })
    } catch (err) {
      self._reply.error = self.getRootError(err)

      // service should exit
      self._shouldCrash = true

      self.finish()
    }
  }

  /**
   * Unsubscribe a topic or subscription id from NATS and Hemera
   *
   * @param {any} topic
   * @param {any} maxMessages
   * @returns
   *
   * @memberOf Hemera
   */
  remove(topic, maxMessages) {
    const self = this

    if (!topic) {
      let error = new Errors.HemeraError(
        Constants.TOPIC_SID_REQUIRED_FOR_DELETION
      )
      self.log.error(error)
      throw error
    }

    if (_.isNumber(topic)) {
      self._transport.unsubscribe(topic, maxMessages)
      return true
    } else {
      const subId = self._topics[topic]

      if (subId) {
        self._transport.unsubscribe(subId, maxMessages)
        this.cleanTopic(topic)
        return true
      }
    }

    return false
  }

  /**
   * Remove topic from list and clean pattern index of topic
   *
   * @param {any} topic
   * @memberof Hemera
   */
  cleanTopic(topic) {
    // release topic so we can add it again
    delete this._topics[topic]
    // remove pattern which belongs to the topic
    _.each(this.list(), add => {
      if (add.pattern.topic === topic) {
        this.router.remove(add.pattern)
      }
    })
  }

  /**
   * The topic is subscribed on NATS and can be called from any client.
   *
   * @param {any} definition
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add(definition, cb) {
    // check for use quick syntax for JSON objects
    if (_.isString(definition)) {
      definition = TinySonic(definition)
    }

    if (!_.isObject(definition)) {
      let error = new Errors.HemeraError(Constants.ADD_PATTERN_REQUIRED)
      this.log.error(error)
      throw error
    }

    // topic is needed to subscribe on a subject in NATS
    if (!definition.topic) {
      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_SUBSCRIBE, {
        definition,
        app: this._config.name
      })

      this.log.error(error)
      throw error
    }

    let schema = Util.extractSchema(definition)
    let patternOnly = Util.cleanPattern(definition)

    const actMeta = {
      schema: schema,
      pattern: patternOnly,
      plugin: this.plugin$,
      transport: {
        topic: definition.topic,
        pubsub: definition.pubsub$,
        maxMessages: definition.maxMessages$,
        queue: definition.queue$
      }
    }

    let addDefinition = new Add(actMeta)

    if (cb) {
      // set callback
      addDefinition.action = cb
    }

    addDefinition.actMeta.transport.topic = patternOnly.topic

    // Support full / token wildcards in subject
    // Convert nats wildcard tokens to RegexExp
    addDefinition.actMeta.pattern.topic = Util.natsWildcardToRegex(
      patternOnly.topic
    )

    let handler = this._router.lookup(addDefinition.actMeta.pattern)

    // check if pattern is already registered
    if (this._config.bloomrun.lookupBeforeAdd && handler) {
      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern: addDefinition.actMeta.pattern
      })

      this.log.error(
        {
          pattern: addDefinition.actMeta.pattern
        },
        error
      )
      throw error
    }

    // check for invalid topic subscriptions
    // it's not possible to register multiple patterns
    // with different transport options to the same topic
    const def = this._checkForTransportCollision(addDefinition)
    if (def) {
      this.log.error(
        Constants.TRANSPORT_OPTIONS_DIFFER_DESC,
        Util.pattern(addDefinition.actMeta.pattern),
        Util.pattern(def.actMeta.pattern)
      )
      throw new Errors.HemeraError(Constants.TRANSPORT_OPTIONS_DIFFER)
    }

    // add to bloomrun
    this._router.add(patternOnly, addDefinition)

    this.log.info(patternOnly, Constants.ADD_ADDED)

    this.subscribe(addDefinition)

    return addDefinition
  }
  /**
   * Check if a topic was already registered with different transport
   * options
   *
   * @param {any} addDefinition
   * @memberof Hemera
   */
  _checkForTransportCollision(addDefinition) {
    const definitions = this._router.list()

    definitions.push(addDefinition)

    for (var i = 0; i < definitions.length; i++) {
      const def = definitions[i]
      const mT1 = def.actMeta.transport
      const mT2 = addDefinition.actMeta.transport

      // looking for another pattern with same topic but
      // different transport options
      if (
        !Object.is(addDefinition, def) &&
        addDefinition.actMeta.pattern.topic === def.actMeta.pattern.topic
      ) {
        if (
          mT1.maxMessages !== mT2.maxMessages ||
          mT1.queue !== mT2.queue ||
          mT1.pubsub !== mT2.pubsub
        ) {
          return def
        }
      }
    }

    return null
  }

  /**
   *
   *
   * @param {any} fn
   * @param {any} cb
   * @memberof Hemera
   */
  _clientExtIterator(fn, cb) {
    const ret = fn(this, cb)
    if (ret && typeof ret.then === 'function') {
      ret.then(cb).catch(cb)
    }
  }

  /**
   *
   *
   * @param {any} response
   *
   * @memberof Hemera
   */
  _sendRequestHandler(response) {
    const self = this
    const res = self._decoderPipeline.run(response, self)
    self._response.payload = res.value
    self._response.error = res.error

    try {
      // decoding error
      if (self._response.error) {
        let error = new Errors.ParseError(
          Constants.PAYLOAD_PARSING_ERROR,
          self.errorDetails
        ).causedBy(self._response.error)
        self.log.error(error)
        self.emit('clientResponseError', self._response.error)
        self._execute(error)
        return
      }

      self._series(
        self,
        self._clientExtIterator,
        self._ext['onClientPostRequest'],
        err => self._onClientPostRequestCompleted(err)
      )
    } catch (err) {
      let error = self.getRootError(err)
      const internalError = new Errors.FatalError(
        Constants.FATAL_ERROR,
        self.errorDetails
      ).causedBy(err)
      self.log.fatal(internalError)
      self.emit('clientResponseError', error)

      // let it crash
      if (self._config.crashOnFatal) {
        self.fatal()
      } else {
        self._execute(error)
      }
    }
  }

  /**
   *
   *
   * @param {any} extensionError
   * @memberof Hemera
   */
  _onClientPostRequestCompleted(extensionError) {
    const self = this

    if (extensionError) {
      let error = self.getRootError(extensionError)
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.emit('clientResponseError', extensionError)
      self._execute(error)
      return
    }

    if (self._response.payload.error) {
      let error = Errio.fromObject(self._response.payload.error)
      const internalError = new Errors.BusinessError(
        Constants.BUSINESS_ERROR,
        self.errorDetails
      ).causedBy(error)
      self.log.error(internalError)
      self.emit('clientResponseError', error)

      self._execute(error)
      return
    }

    self._execute(null, self._response.payload.result)
  }

  /**
   * Start an action.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  act(pattern, cb) {
    // check for use quick syntax for JSON objects
    if (_.isString(pattern)) {
      pattern = TinySonic(pattern)
    }

    if (!_.isObject(pattern)) {
      let error = new Errors.HemeraError(Constants.ACT_PATTERN_REQUIRED)
      this.log.error(error)
      throw error
    }

    // create new execution context
    let hemera = this.createContext()
    hemera._pattern = pattern
    hemera._parentContext = this
    hemera._cleanPattern = Util.cleanFromSpecialVars(pattern)
    hemera._response = new ClientResponse()
    hemera._request = new ClientRequest()
    hemera._isServer = false
    hemera._execute = null
    hemera._defer = pDefer()
    hemera._actCallback = null

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      let error = new Errors.HemeraError(
        Constants.NO_TOPIC_TO_REQUEST,
        hemera.errorDetails
      )
      this.log.error(error)
      throw error
    }

    if (cb) {
      hemera._actCallback = cb.bind(hemera)
    }

    hemera._execute = (err, result) => {
      if (hemera._actCallback) {
        const promise = hemera._actCallback(err, result)
        if (promise) {
          // check when using async / await
          if (typeof promise.then === 'function') {
            promise.then(hemera._defer.resolve).catch(hemera._defer.reject)
          } else {
            // when using callback style we always resolve with the function result
            hemera._defer.resolve(promise)
          }
        }
        return
      }

      // when no callback was passed we handle it as promise style
      if (err) {
        hemera._defer.reject(err)
      } else {
        hemera._defer.resolve(result)
      }
    }

    hemera._series(
      hemera,
      hemera._clientExtIterator,
      hemera._ext['onClientPreRequest'],
      err => hemera._onPreRequestCompleted(err)
    )

    return hemera._defer.promise
  }

  /**
   *
   *
   * @param {any} err
   * @returns
   * @memberof Hemera
   */
  getRootError(err) {
    let error = null
    if (err instanceof SuperError) {
      error = err.rootCause || err.cause || err
    } else {
      error = err
    }
    return error
  }

  /**
   *
   *
   * @param {any} err
   * @memberof Hemera
   */
  _onPreRequestCompleted(err) {
    const self = this
    let m = self._encoderPipeline.run(self._message, self)

    // encoding issue
    if (m.error) {
      let error = new Errors.ParseError(
        Constants.PAYLOAD_PARSING_ERROR
      ).causedBy(m.error)
      self.log.error(error)
      self.emit('clientResponseError', error)
      self._execute(error)
      return
    }

    if (err) {
      let error = self.getRootError(err)
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR
      ).causedBy(err)
      self.log.error(internalError)
      self.emit('clientResponseError', error)
      self._execute(error)
      return
    }

    self._request.payload = m.value
    self._request.error = m.error

    // use simple publish mechanism instead of request/reply
    if (self._pattern.pubsub$ === true) {
      self._transport.send(self._pattern.topic, self._request.payload, err =>
        self._execute(err)
      )
    } else {
      const optOptions = {}
      // limit on the number of responses the requestor may receive
      if (self._pattern.maxMessages$ > 0) {
        optOptions.max = self._pattern.maxMessages$
      } else if (self._pattern.maxMessages$ !== -1) {
        optOptions.max = 1
      }
      // send request
      self._sid = self._transport.sendRequest(
        self._pattern.topic,
        self._request.payload,
        optOptions,
        resp => self._sendRequestHandler(resp)
      )

      // handle timeout
      self.handleTimeout()
    }
  }
  /**
   * Handle the timeout when a pattern could not be resolved. Can have different reasons:
   * - No one was connected at the time (service unavailable)
   * - Service is actually still processing the request (service takes too long)
   * - Service was processing the request but crashed (service error)
   *
   *
   * @memberOf Hemera
   */
  handleTimeout() {
    const self = this
    const timeout = self._pattern.timeout$ || this._config.timeout

    let timeoutHandler = () => {
      const error = new Errors.TimeoutError(
        Constants.ACT_TIMEOUT_ERROR,
        self.errorDetails
      )
      self.log.error(error)
      self._response.error = error
      self.emit('clientResponseError', error)

      self._series(
        self,
        self._clientExtIterator,
        self._ext['onClientPostRequest'],
        err => self._onClientTimeoutPostRequestCompleted(err)
      )
    }

    self._transport.timeout(self._sid, timeout, 1, timeoutHandler)
  }

  /**
   *
   *
   * @param {any} err
   * @memberof Hemera
   */
  _onClientTimeoutPostRequestCompleted(err) {
    const self = this

    if (err) {
      let error = self.getRootError(err)
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR
      ).causedBy(err)
      self.log.error(internalError)
      self._response.error = error
      self.emit('clientResponseError', error)
    }

    try {
      self._execute(self._response.error)
    } catch (err) {
      let error = self.getRootError(err)
      const internalError = new Errors.FatalError(
        Constants.FATAL_ERROR,
        self.errorDetails
      ).causedBy(err)
      self.log.fatal(internalError)
      self.emit('clientResponseError', error)

      // let it crash
      if (self._config.crashOnFatal) {
        self.fatal()
      }
    }
  }

  /**
   * Create new instance of hemera but based on the current prototype
   * so we are able to create a scope per act without lossing the reference to the core api.
   *
   * @returns
   *
   * @memberOf Hemera
   */
  createContext() {
    const self = this

    const hemera = Object.create(self)

    return hemera
  }

  /**
   * Return the list of all registered actions
   *
   * @param {any} pattern
   * @param {any} options
   * @returns
   *
   * @memberOf Hemera
   */
  list(pattern, options) {
    return this._router.list(pattern, options)
  }

  /**
   * Remove all registered pattern and release topic from NATS
   *
   * @memberof Hemera
   */
  removeAll() {
    _.each(this._topics, (val, key) => this.remove(key))
  }

  /**
   *
   *
   * @memberof Hemera
   */
  close(cb) {
    this.shutdown((err, instance, done) => {
      instance._onClose(err, err => {
        if (_.isFunction(cb)) {
          cb(err)
        }
        done(err)
      })
    })
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} cb
   * @memberof Hemera
   */
  _onClose(err, cb) {
    const self = this
    // remove all active subscriptions
    self.removeAll()

    // Waiting before all queued messages was proceed
    // and then close hemera and nats
    self._transport.flush(() => {
      self._heavy.stop()
      // Does not throw an issue when connection is not available
      self._transport.close()

      if (err) {
        self.log.error(err)
        self.emit('error', err)
      }

      if (_.isFunction(cb)) {
        cb(err)
      }
    })
  }
}

module.exports = Hemera
