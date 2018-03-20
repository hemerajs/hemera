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

const NATS = require('nats')
const EventEmitter = require('events')
const Bloomrun = require('bloomrun')
const Errio = require('errio')
const Heavy = require('heavy')
const Pino = require('pino')
const TinySonic = require('tinysonic')
const SuperError = require('super-error')
const Joi = require('joi')
const Avvio = require('avvio')
const Series = require('fastseries')

const Errors = require('./errors')
const Constants = require('./constants')
const Symbols = require('./symbols')
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
const Reply = require('./reply')
const Add = require('./add')
const ExtensionManager = require('./extensionManager')

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

    this._isReady = false
    this._config = config.value
    this._router = Bloomrun(this._config.bloomrun)
    this._heavy = new Heavy(this._config.load.process)
    this._transport = new NatsTransport({
      transport
    })
    this._topics = {}

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
    this._topic = ''
    this._request = null
    this._response = null
    this._pattern = null
    this._actCallback = null
    this._execute = null
    this._cleanPattern = ''

    this.matchedAction = null

    this._clientEncoder = DefaultEncoder.encode
    this._clientDecoder = DefaultDecoder.decode
    this._serverEncoder = DefaultEncoder.encode
    this._serverDecoder = DefaultDecoder.decode
    this._schemaCompiler = null

    // errio settings
    Errio.setDefaults(this._config.errio)

    // Register all default hemera errors
    this._registerErrors()

    // create load policy
    this._loadPolicy = this._heavy.policy(this._config.load.policy)

    // start tracking process stats
    this._heavy.start()

    this._onAddHandlers = []

    this._extensionManager = new ExtensionManager()
    this._extensionManager.add(
      'onClientPreRequest',
      DefaultExtensions.onClientPreRequest
    )
    this._extensionManager.add(
      'onClientPostRequest',
      DefaultExtensions.onClientPostRequest
    )
    this._extensionManager.add(
      'onServerPreRequest',
      DefaultExtensions.onServerPreRequest
    )

    this._avvio = Avvio(this, {
      autostart: false,
      expose: {
        use: 'register',
        close: 'shutdown',
        onClose: 'onShutdown',
        ready: 'bootstrap'
      }
    })

    this[Symbols.childrenKey] = []
    this[Symbols.registeredPlugins] = []

    this._avvio.override = (hemera, plugin, opts) => {
      const skipOverride = plugin[Symbols.pluginSkipOverride]
      const pluginName = plugin[Symbols.pluginName]

      if (pluginName) {
        hemera[Symbols.registeredPlugins].push(pluginName)
      }

      if (skipOverride) {
        return hemera
      }

      const instance = Object.create(hemera)
      const proto = Object.getPrototypeOf(instance)

      hemera[Symbols.childrenKey].push(instance)
      instance[Symbols.childrenKey] = []

      if (hemera._config.childLogger && pluginName) {
        instance.log = hemera.log.child({ plugin: pluginName })
      }

      instance[Symbols.registeredPlugins] = Object.create(
        hemera[Symbols.registeredPlugins]
      )

      // inherit all extensions
      instance._extensionManager = ExtensionManager.build(
        hemera._extensionManager
      )

      // overwrite decorate function to extend the prototype
      instance.decorate = function decorate(prop, value, deps) {
        if (prop in this) {
          throw new Errors.HemeraError(Constants.DECORATION_ALREADY_DEFINED)
        }

        if (deps) {
          instance._checkDecoraterDependencies(deps)
        }

        // due to the fact that each plugin has his own scope, we have to
        // extend the prototype
        proto[prop] = value
      }

      return instance
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
   * @param {*} fn
   */
  setServerDecoder(fn) {
    this._serverDecoder = fn
  }

  /**
   *
   * @param {*} fn
   */
  setServerEncoder(fn) {
    this._serverEncoder = fn
  }
  /**
   *
   * @param {*} fn
   */
  setClientDecoder(fn) {
    this._clientDecoder = fn
  }

  /**
   *
   * @param {*} fn
   */
  setClientEncoder(fn) {
    this._clientEncoder = fn
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
   * Add an onAdd handler
   *
   * @param {any} handler
   *
   * @memberOf Hemera
   */
  _addOnAddHandler(handler) {
    this._onAddHandlers.push(handler)
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
    if (typeof handler !== 'function') {
      let error = new Errors.HemeraError(Constants.INVALID_EXTENSION_HANDLER, {
        type,
        handler
      })
      throw error
    }

    if (type === 'onAdd') {
      this._addOnAddHandler(handler)
    } else if (type === 'onClose') {
      this.onShutdown(handler)
    } else {
      this._extensionManager.add(type, handler)
    }
  }

  /**
   *
   * @param {*} fn
   */
  setSchemaCompiler(fn) {
    this._schemaCompiler = fn
  }

  /**
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal() {
    this.close(() => process.exit(1))
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
    if (prop in this) {
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
    const dependencies = plugin[Symbols.pluginDependencies]
    if (!dependencies) {
      return
    }
    if (!Array.isArray(dependencies)) {
      throw new Error(Constants.PLUGIN_DEP_STRINGS)
    }

    dependencies.forEach(dependency => {
      if (this[Symbols.registeredPlugins].indexOf(dependency) === -1) {
        throw new Error(`The dependency '${dependency}' is not registered`)
      }
    })
  }

  /**
   *
   *
   * @param {any} plugin
   * @returns
   * @memberof Hemera
   */
  use(plugin, opts) {
    let pluginOpts = Object.assign({}, plugin[Symbols.pluginOptions], opts)
    this.register(plugin, pluginOpts)
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
    // Register the class with Errio
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
    if (this._isReady) {
      throw new Errors.HemeraError('Hemera was already bootstraped')
    }

    this._isReady = true

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

    const ready = cb => {
      if (this._transport.driver.connected) {
        this.log.info(Constants.NATS_TRANSPORT_CONNECTED)
        this.bootstrap(cb)
      } else {
        this._transport.driver.on('connect', () => {
          this.log.info(Constants.NATS_TRANSPORT_CONNECTED)
          this.bootstrap(cb)
        })
      }
    }

    // callback style
    if (typeof cb === 'function') {
      ready(err => {
        if (err) {
          this.log.error(err)
          cb(err)
          return
        }
        cb()
      })
      return
    }

    // promise style
    return new Promise((resolve, reject) => {
      ready(err => {
        if (err) {
          this.log.error(err)
          reject(err)
          return
        }
        resolve()
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
    const ret = fn(this, this._request, this.reply, cb)

    if (ret && typeof ret.then === 'function') {
      ret.then(cb).catch(cb)
    }
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
   *  Attach one handler to the topic subscriber.
   *  With subToMany and maxMessages you control NATS specific behaviour.
   *
   * @param {any} addDefinition
   * @memberof Hemera
   */
  subscribe(addDefinition) {
    const self = this

    const topic = addDefinition.transport.topic
    const maxMessages = addDefinition.transport.maxMessages
    const queue = addDefinition.transport.queue
    const pubsub = addDefinition.transport.pubsub
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
      hemera._request = new ServerRequest(request)
      hemera._response = new ServerResponse(replyTo)
      hemera.reply = new Reply(
        hemera._request,
        hemera._response,
        hemera,
        hemera.log
      )
      hemera._pattern = {}
      hemera._isServer = true

      // represent the matched server action "add"
      hemera.matchedAction = {}

      hemera._series(
        hemera,
        hemera._serverExtIterator,
        hemera._extensionManager['onServerPreRequest'],
        err => hemera._onServerPreRequestCompleted(err)
      )
    }

    // standard pubsub with optional max messages
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

    if (extensionError) {
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.emit('serverResponseError', extensionError)
      self.reply.send(extensionError)
      return
    }

    // check if a handler is registered with this pattern
    if (self.matchedAction) {
      self.emit('serverPreHandler', self)
      if (self._extensionManager['onServerPreHandler'].length) {
        self._series(
          self,
          self._serverExtIterator,
          self._extensionManager['onServerPreHandler'],
          err => self._onServerPreHandlerCompleted(err)
        )
        return
      }
      self._onServerPreHandlerCompleted()
    } else {
      const internalError = new Errors.PatternNotFound(
        Constants.PATTERN_NOT_FOUND,
        self.errorDetails
      )
      self.log.error(internalError)
      self.emit('serverResponseError', internalError)
      self.reply.send(internalError)
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

    if (extensionError) {
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.emit('serverResponseError', extensionError)
      self.reply.send(extensionError)
      return
    }

    let action = self.matchedAction.action.bind(self)

    // add middleware
    self.matchedAction.run(self._request, self.reply, err => {
      if (err) {
        const internalError = new Errors.HemeraError(
          Constants.ADD_MIDDLEWARE_ERROR,
          self.errorDetails
        ).causedBy(err)
        self.log.error(internalError)
        self.emit('serverResponseError', err)
        self.reply.send(err)
        return
      }

      // if request type is 'pubsub' we don't have to reply back
      if (
        self._request.payload.request.type === Constants.REQUEST_TYPE_PUBSUB
      ) {
        action(self._request.payload.pattern)
        self.reply.send()
        return
      }

      const result = action(self._request.payload.pattern, (err, result) =>
        self.reply.send(err || result)
      )

      const isPromise = result && typeof result.then === 'function'
      if (isPromise) {
        result.then(x => self.reply.send(x)).catch(e => self.reply.send(e))
      }
    })
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

    // when sid was passed
    if (typeof topic === 'string') {
      // when topic name was passed
      const subId = self._topics[topic]

      if (subId) {
        self._transport.unsubscribe(subId, maxMessages)
        // we remove all subscription related to this topic
        this.cleanTopic(topic)
        return true
      }
    } else {
      self._transport.unsubscribe(topic, maxMessages)
      return true
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
    this.list().forEach(add => {
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
    if (!definition) {
      let error = new Errors.HemeraError(Constants.ADD_PATTERN_REQUIRED)
      this.log.error(error)
      throw error
    }

    // check for use quick syntax for JSON objects
    if (typeof definition === 'string') {
      definition = TinySonic(definition)
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

    const addDef = {
      schema: schema,
      pattern: patternOnly,
      transport: {
        topic: definition.topic,
        pubsub: definition.pubsub$,
        maxMessages: definition.maxMessages$,
        expectedMessages: definition.expectedMessages$,
        queue: definition.queue$
      }
    }

    let addDefinition = new Add(addDef)

    if (cb) {
      // set callback
      addDefinition.action = cb
    }

    // Support full / token wildcards in subject
    // Convert nats wildcard tokens to RegexExp
    addDefinition.pattern.topic = Util.natsWildcardToRegex(patternOnly.topic)

    let handler = this._router.lookup(addDefinition.pattern)

    // check if pattern is already registered
    if (this._config.bloomrun.lookupBeforeAdd && handler) {
      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern: addDefinition.pattern
      })

      this.log.error(
        {
          pattern: addDefinition.pattern
        },
        error
      )
      throw error
    }

    // check for invalid topic subscriptions
    // it's not possible to register multiple patterns
    // with different transport options with the same topic
    const def = this._checkForTransportCollision(addDefinition)
    if (def) {
      this.log.error(
        Constants.TRANSPORT_OPTIONS_DIFFER_DESC,
        Util.pattern(addDefinition.pattern),
        Util.pattern(def.pattern)
      )
      throw new Errors.HemeraError(Constants.TRANSPORT_OPTIONS_DIFFER)
    }

    // add to bloomrun
    this._router.add(patternOnly, addDefinition)

    this.log.info(patternOnly, Constants.ADD_ADDED)

    this.subscribe(addDefinition)

    this._runOnAddHandler(addDefinition)

    return addDefinition
  }
  /**
   * Run all onAdd handlers in serie
   * options
   *
   * @param {any} addDefinition
   * @memberof Hemera
   */
  _runOnAddHandler(addDefinition) {
    this._series(
      this,
      (fn, cb) => {
        fn(addDefinition)
        cb()
      },
      this._onAddHandlers
    )
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
      const mT1 = def.transport
      const mT2 = addDefinition.transport

      // looking for another pattern with same topic but
      // different transport options
      if (
        !Object.is(addDefinition, def) &&
        addDefinition.pattern.topic === def.pattern.topic
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

    if (response.code && response.code === NATS.REQ_TIMEOUT) {
      self._timeoutHandler()
      return
    }

    const res = self._clientDecoder(response)
    self._response.payload = res.value
    self._response.error = res.error

    // decoding error
    if (self._response.error) {
      let internalError = new Errors.ParseError(
        Constants.PAYLOAD_PARSING_ERROR,
        self.errorDetails
      ).causedBy(self._response.error)
      self.log.error(internalError)
      self.emit('clientResponseError', self._response.error)
      self._execute(self._response.error)
      return
    }

    self._series(
      self,
      self._clientExtIterator,
      self._extensionManager['onClientPostRequest'],
      err => self._onClientPostRequestCompleted(err)
    )
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
    if (!pattern) {
      let error = new Errors.HemeraError(Constants.ACT_PATTERN_REQUIRED)
      this.log.error(error)
      throw error
    }

    // check for use quick syntax for JSON objects
    if (typeof pattern === 'string') {
      pattern = TinySonic(pattern)
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
    hemera._actCallback = null
    hemera.sid = 0

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
      hemera._execute = hemera._actCallback
      hemera._series(
        hemera,
        hemera._clientExtIterator,
        hemera._extensionManager['onClientPreRequest'],
        err => hemera._onPreRequestCompleted(err)
      )
    } else {
      const evaluateResult = new Promise((resolve, reject) => {
        hemera._execute = (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      })

      hemera._series(
        hemera,
        hemera._clientExtIterator,
        hemera._extensionManager['onClientPreRequest'],
        err => hemera._onPreRequestCompleted(err)
      )

      return evaluateResult.then(resp => {
        return {
          context: hemera,
          data: resp
        }
      })
    }
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
    let m = self._clientEncoder(self._message)

    // encoding issue
    if (m.error) {
      let error = new Errors.ParseError(
        Constants.PAYLOAD_PARSING_ERROR
      ).causedBy(m.error)
      self.log.error(error)
      self.emit('clientResponseError', m.error)
      self._execute(m.error)
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
      const optOptions = {
        timeout: self._pattern.timeout$ || self.config.timeout,
        // default is request-reply semantic but we can assign -1 (no limit)
        // but the user has to unsubscribe it
        max: 1
      }
      // limit on the number of responses the requestor may receive
      if (
        self._pattern.maxMessages$ > 0 ||
        self._pattern.expectedMessages$ > 0
      ) {
        // we can't receive more messages than "expected" messages
        // the inbox is closed automatically
        optOptions.max =
          self._pattern.expectedMessages$ || self._pattern.maxMessages$
      }
      // send request
      self.sid = self._transport.sendRequest(
        self._pattern.topic,
        self._request.payload,
        optOptions,
        resp => self._sendRequestHandler(resp)
      )

      // create timeout handler only with a combination of expected msg
      // the default timeout handler is created by NATS client
      if (self._pattern.expectedMessages$ > 0) {
        self._handleTimeout()
      }
    }
  }
  /**
   * Handle the timeout when a pattern could not be resolved. Can have different reasons:
   * - No one was connected at the time (service unavailable)
   * - Service is actually still processing the request (service takes too long)
   * - Service was processing the request but crashed (service error)
   *
   * @memberOf Hemera
   */
  _handleTimeout() {
    const self = this

    self._transport.timeout(
      self.sid,
      self._pattern.timeout$ || this._config.timeout,
      self._pattern.expectedMessages$,
      () => this._timeoutHandler()
    )
  }

  /**
   *
   * @memberof Hemera
   */
  _timeoutHandler() {
    const self = this

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
      self._extensionManager['onClientPostRequest'],
      err => self._onClientTimeoutPostRequestCompleted(err)
    )
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

    self._execute(self._response.error)
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
    return Object.create(this)
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
    for (const key in this._topics) {
      this.remove(key)
    }
  }

  /**
   *
   *
   * @memberof Hemera
   */
  close(cb) {
    const self = this

    // callback style
    if (typeof cb === 'function') {
      self.shutdown((err, instance, done) => {
        instance._onClose(() => {
          if (err) {
            self.log.error(err)
            cb(err)
          } else {
            cb()
          }
          done(err)
        })
      })
      return
    }

    // promise style
    return new Promise((resolve, reject) => {
      self.shutdown((err, instance, done) => {
        instance._onClose(() => {
          if (err) {
            self.log.error(err)
            reject(err)
          } else {
            resolve()
          }
          done()
        })
      })
    })
  }

  /**
   *
   * @param {any} cb
   * @memberof Hemera
   */
  _onClose(cb) {
    const self = this
    // remove all active subscriptions
    self.removeAll()

    // Waiting before all queued messages was proceed
    // and then close hemera and nats
    self._transport.flush(() => {
      self._heavy.stop()
      // Does not throw an issue when connection is not available
      self._transport.close()
      if (typeof cb === 'function') {
        cb()
      }
    })
  }
}

module.exports = Hemera
