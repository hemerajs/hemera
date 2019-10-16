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

const NATS = require('nats')
const Bloomrun = require('bloomrun')
const Errio = require('errio')
const Heavy = require('heavy')
const Pino = require('pino')
const TinySonic = require('tinysonic')
const SuperError = require('super-error')
const Joi = require('joi')
const Avvio = require('avvio')
const { Stream } = require('stream')

const runExt = require('./extensionRunner').extRunner
const Errors = require('./errors')
const Util = require('./util')
const NatsTransport = require('./transport')
const DefaultExtensions = require('./extensions')
const DefaultEncoder = require('./encoder')
const DefaultDecoder = require('./decoder')
const ServerResponse = require('./serverResponse')
const ServerRequest = require('./serverRequest')
const ClientRequest = require('./clientRequest')
const ClientResponse = require('./clientResponse')
const ConfigScheme = require('./configScheme')
const Reply = require('./reply')
const Add = require('./add')
const ExtensionManager = require('./extensionManager')
const { sChildren, sRegisteredPlugins, sReplySent } = require('./symbols')
const { serverExtIterator, clientExtIterator } = require('./extensionRunner')

const natsConnCodes = [NATS.CONN_ERR, NATS.SECURE_CONN_REQ, NATS.NON_SECURE_CONN_REQ, NATS.CLIENT_CERT_REQ]

/**
 * @class Hemera
 */
class Hemera {
  /**
   * Creates an instance of Hemera
   *
   * @param {Nats} transport
   * @param {Config} params
   *
   * @memberOf Hemera
   */
  constructor(transport, params) {
    const config = Joi.validate(params || {}, ConfigScheme)
    if (config.error) {
      throw config.error
    }

    this._root = this
    this._isReady = false
    this._config = config.value
    this._router = Bloomrun(this._config.bloomrun)
    this._heavy = new Heavy(this._config.load.process)
    this._transport = new NatsTransport({
      transport
    })
    this._topics = new Map()

    // special variables for the new execution context
    this.context$ = {}
    this.meta$ = {}
    this.delegate$ = {}
    this.auth$ = {}
    this.trace$ = {}
    this.request$ = {
      type: 'request',
      id: ''
    }
    this.sid = 0

    // represent the 'Add' instance
    this.matchedAction = null
    this.request = null
    this.response = null

    this._topic = ''
    this._pattern = null
    // represent the 'act' handler
    this._execute = null
    this._cleanPattern = ''

    this._clientEncoder = DefaultEncoder.encode
    this._clientDecoder = DefaultDecoder.decode
    this._serverEncoder = DefaultEncoder.encode
    this._serverDecoder = DefaultDecoder.decode
    this._schemaCompiler = null
    this._responseSchemaCompiler = null
    this._errorHandler = null
    this._idGenerator = Util.randomId

    // errio settings
    Errio.setDefaults(this._config.errio)

    // Register all default hemera errors
    this._registerErrors()

    // create load policy
    this._loadPolicy = this._heavy.policy(this._config.load.policy)

    // start tracking process stats
    this._heavy.start()

    // when a route for a pattern could not be found
    this._notFoundPattern = null

    this._onAddHandlers = []

    this._extensionManager = new ExtensionManager()
    this._extensionManager.add('onAct', DefaultExtensions.onAct)
    this._extensionManager.add('onActFinished', DefaultExtensions.onActFinished)
    this._extensionManager.add('onRequest', DefaultExtensions.onRequest)
    this._extensionManager.add('onSend', DefaultExtensions.onSend)

    this._configureLogger()

    this._avvio = Avvio(this, {
      autostart: false,
      expose: {
        use: 'register',
        close: 'shutdown',
        onClose: 'onShutdown',
        ready: 'bootstrap'
      },
      timeout: this._config.pluginTimeout
    })

    this[sChildren] = []
    this[sRegisteredPlugins] = []

    this._avvio.override = (hemera, plugin) => {
      const pluginMeta = this.getPluginMeta(plugin)

      if (pluginMeta) {
        if (pluginMeta.name) {
          hemera[sRegisteredPlugins].push(pluginMeta.name)
        }
        hemera.checkPluginDependencies(plugin)
        hemera.checkPluginDecorators(plugin)
      }

      if (plugin[Symbol.for('plugin-scoped')] === false) {
        return hemera
      }

      const instance = Object.create(hemera)

      hemera[sChildren].push(instance)
      instance[sChildren] = []

      if (pluginMeta && pluginMeta.name && hemera._config.childLogger) {
        instance.log = hemera.log.child({ plugin: pluginMeta.name })
      }

      instance[sRegisteredPlugins] = Object.create(hemera[sRegisteredPlugins])

      // inherit all extensions
      instance._extensionManager = ExtensionManager.build(hemera._extensionManager)

      // decorate root instance. All instances will have access
      instance.decorate = function decorate() {
        hemera.decorate.apply(this._root, arguments)
        return instance
      }

      return instance
    }
  }

  /**
   *
   *
   * @memberof Hemera
   */
  _configureLogger() {
    const loggerOpts = {
      name: this._config.name,
      prettyPrint: this._config.prettyLog,
      level: this._config.logLevel
    }
    if (this._config.logger instanceof Stream) {
      this.log = Pino(loggerOpts, this._config.logger)
    } else if (this._config.logger) {
      this.log = this._config.logger
    } else {
      this.log = Pino(loggerOpts)
    }
  }

  /**
   *
   *
   * @memberof Hemera
   */
  _registerErrors() {
    for (const error in Hemera.errors) {
      Errio.register(Hemera.errors[error])
    }
  }

  /**
   *
   * @param {*} fn
   */
  setIdGenerator(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError(`IdGenerator must be a function`)
    }
    this._idGenerator = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setServerDecoder(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError(`ServerDecoder must be a function`)
    }
    this._serverDecoder = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setServerEncoder(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError(`ServerEncoder must be a function`)
    }
    this._serverEncoder = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setClientDecoder(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError(`ClientDecoder must be a function`)
    }
    this._clientDecoder = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setClientEncoder(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError(`ClientEncoder must be a function`)
    }
    this._clientEncoder = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setNotFoundPattern(pattern) {
    // check for use quick syntax for JSON objects
    if (typeof pattern === 'string') {
      pattern = TinySonic(pattern)
    }

    this._notFoundPattern = pattern

    return this
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
   * @readonly
   *
   * @memberOf Hemera
   */
  get notFoundPattern() {
    return this._notFoundPattern
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
   * Create a custom super error object
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  static createError(name) {
    if (typeof name !== 'string') {
      throw new Errors.HemeraError(`Error name must be a string`)
    }

    const ctor = SuperError.subclass(name)
    // Register the class with Errio.
    Errio.register(ctor)
    return ctor
  }

  /**
   * Create a custom super error object
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
      throw new Errors.HemeraError('Extension handler must be a function')
    }

    if (type === 'onAdd') {
      this._addOnAddHandler(handler)
    } else if (type === 'onClose') {
      this.onShutdown(handler)
    } else {
      this._extensionManager.add(type, handler)
    }

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setSchemaCompiler(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError('SchemaCompiler handler must be a function')
    }
    this._schemaCompiler = fn

    return this
  }

  /**
   *
   * @param {*} fn
   */
  setResponseSchemaCompiler(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError('ResponseSchemaCompiler handler must be a function')
    }
    this._responseSchemaCompiler = fn

    return this
  }

  setErrorHandler(fn) {
    if (typeof fn !== 'function') {
      throw new Errors.HemeraError('ErrorHandler handler must be a function')
    }
    this._errorHandler = fn

    return this
  }

  /**
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal() {
    // eslint-disable-next-line no-process-exit
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
      throw new Errors.HemeraError('Decoration has been already added')
    }

    if (deps) {
      this._checkMemberDependencies(deps)
    }

    this[prop] = value

    return this
  }

  /**
   * Expose a value to the current instance
   *
   * @param {any} prop
   * @param {any} value
   *
   * @memberOf Hemera
   */
  expose(prop, value, deps) {
    if (prop in this) {
      throw new Errors.HemeraError('Exposition has been already added')
    }

    if (deps) {
      this._checkMemberDependencies(deps)
    }

    this[prop] = value

    return this
  }

  /**
   *
   *
   * @param {any} deps
   * @memberof Hemera
   */
  _checkMemberDependencies(deps) {
    for (let i = 0; i < deps.length; i++) {
      if (!(deps[i] in this)) {
        throw new Errors.HemeraError(`Missing member dependency '${deps[i]}'`)
      }
    }
  }

  /**
   *
   * @param {*} plugin
   */
  getPluginMeta(plugin) {
    return plugin[Symbol.for('plugin-meta')]
  }

  /**
   *
   *
   * @param {any} deps
   * @memberof Hemera
   */
  checkPluginDependencies(plugin) {
    const pluginMeta = this.getPluginMeta(plugin)
    if (!pluginMeta) {
      return
    }
    const { dependencies } = pluginMeta
    if (!dependencies) {
      return
    }
    if (!Array.isArray(dependencies)) {
      throw new Errors.HemeraError('Plugin dependencies must be an array of strings')
    }
    dependencies.forEach(dependency => {
      if (this[sRegisteredPlugins].indexOf(dependency) === -1) {
        throw new Errors.HemeraError(`The dependency '${dependency}' is not registered`)
      }
    })
  }

  /**
   *
   *
   * @param {any} deps
   * @memberof Hemera
   */
  checkPluginDecorators(plugin) {
    const pluginMeta = this.getPluginMeta(plugin)
    if (!pluginMeta) {
      return
    }
    const { decorators } = pluginMeta
    if (!decorators) {
      return
    }
    if (!Array.isArray(decorators)) {
      throw new Errors.HemeraError('Plugin decorators must be an array of strings')
    }
    for (let i = 0; i < decorators.length; i++) {
      if (!(decorators[i] in this)) {
        throw new Errors.HemeraError(`The decorator dependency '${decorators[i]}' is not registered`)
      }
    }
  }

  /**
   *
   *
   * @param {any} plugin
   * @returns
   * @memberof Hemera
   */
  use(plugin, opts) {
    const pluginMeta = this.getPluginMeta(plugin)
    let pluginOpts = pluginMeta ? pluginMeta.options : {}
    pluginOpts = Object.assign({}, pluginOpts, opts)
    this.register(plugin, pluginOpts)
    return this._avvio
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
      this.log.error(err, 'Could not connect to NATS!')
      this.log.error("NATS Code: '%s', Message: %s", err.code, err.message)

      // Exit only on connection issues.
      // Authorization and protocol issues don't lead to process termination
      if (natsConnCodes.indexOf(err.code) > -1) {
        // We have no NATS connection and can only gracefully shutdown hemera
        this.close()
      }
    })

    this._transport.driver.on('permission_error', err => {
      this.log.error(err, 'NATS permission error')
    })

    this._transport.driver.on('reconnect', () => {
      this.log.info('NATS reconnected!')
    })

    this._transport.driver.on('reconnecting', () => {
      this.log.warn('NATS reconnecting ...')
    })

    this._transport.driver.on('disconnect', () => {
      this.log.warn('NATS disconnected!')
    })

    // when nats was not able to reconnect or connection was closed due to other reasons
    // the process should die and restarted
    this._transport.driver.on('close', () => {
      this.log.error(new Errors.HemeraError('NATS connection closed!'))
    })

    const ready = cb => {
      if (this._transport.driver.connected) {
        this.log.info('Connected!')
        this.bootstrap(cb)
      } else {
        this._transport.driver.on('connect', () => {
          this.log.info('Connected!')
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

    const { topic } = addDefinition.transport
    const { maxMessages } = addDefinition.transport
    const queue = addDefinition.transport.queue || `queue.${topic}`
    const { pubsub } = addDefinition.transport

    // avoid duplicate subscribers of the emit stream
    // we use one subscriber per topic
    if (self._topics.has(topic)) {
      self.log.debug(`Topic '${topic}' was already subscribed!`)
      return 0
    }

    const handler = (request, replyTo) => {
      // create new execution context
      // this will also encapsulate a topic to the plugin
      const hemera = self.createContext()
      hemera._topic = topic
      hemera.request = new ServerRequest(request)
      hemera.response = new ServerResponse(replyTo)
      hemera.reply = new Reply(hemera.request, hemera.response, hemera, hemera.log)
      hemera._pattern = null
      hemera._isServer = true

      // represent the matched server action "add"
      hemera.matchedAction = null

      if (hemera._extensionManager.onRequest.length) {
        runExt(hemera._extensionManager.onRequest, serverExtIterator, hemera, err =>
          hemera._onRequestCompleted(err)
        )
        return
      }

      hemera._onRequestCompleted()
    }

    // standard pubsub with optional max messages
    if (pubsub) {
      return self._transport.subscribe(
        topic,
        {
          max: maxMessages
        },
        handler
      )
    } else {
      // queue group names allow load balancing (random) of services
      return self._transport.subscribe(
        topic,
        {
          queue,
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
  _onRequestCompleted(extensionError) {
    const self = this

    if (extensionError) {
      const internalError = new Errors.HemeraError('onRequest extension', self.errorDetails).causedBy(
        extensionError
      )
      self.log.error(internalError)
      self.reply.isError = true
      self.reply.send(extensionError)
      return
    }

    // check if a handler is registered with this pattern
    if (self.matchedAction) {
      if (self._extensionManager.preHandler.length) {
        runExt(self._extensionManager.preHandler, serverExtIterator, self, err =>
          self._preHandlerCompleted(err)
        )
      } else {
        self._preHandlerCompleted()
      }
    } else {
      const internalError = new Errors.PatternNotFound('No action found for this pattern', self.errorDetails)
      self.log.error(internalError)
      self.reply.isError = true
      self.reply.send(internalError)
    }
  }

  /**
   *
   *
   * @param {any} extensionError
   * @memberof Hemera
   */
  _preHandlerCompleted(extensionError) {
    const self = this

    if (extensionError) {
      const internalError = new Errors.HemeraError('preHandler extension', self.errorDetails).causedBy(
        extensionError
      )
      self.log.error(internalError)
      self.reply.isError = true
      self.reply.send(extensionError)
      return
    }

    // action middleware
    self.matchedAction.run(self.request, self.reply, err => self._afterMiddlewareHandler(err))
  }

  /**
   *
   *
   * @param {any} err
   * @memberof Hemera
   */
  _afterMiddlewareHandler(err) {
    const self = this

    if (err) {
      const internalError = new Errors.HemeraError('Action middleware', self.errorDetails).causedBy(err)
      self.log.error(internalError)
      self.reply.isError = true
      self.reply.send(err)
      return
    }

    if (self.reply[sReplySent] === true) {
      return
    }

    const result = self._processServerAction()

    if (result && typeof result.then === 'function') {
      // eslint-disable-next-line promise/catch-or-return
      result.then(
        payload => self.reply.send(payload),
        err => {
          self.reply.isError = true
          self.reply.send(err)
        }
      )
    }
  }

  /**
   *
   *
   * @returns
   * @memberof Hemera
   */
  _processServerAction() {
    const self = this
    const action = self.matchedAction.action.bind(self)

    // if request type is 'pubsub' we don't have to reply back
    if (self.request.payload.request.type === 'pubsub') {
      action(self.request.payload.pattern)
      self.reply.send()
      return
    }

    return action(self.request.payload.pattern, (err, result) => {
      if (err) {
        self.reply.isError = true
        self.reply.send(err)
        return
      }
      self.reply.send(result)
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
      const error = new Errors.HemeraError('The sid or topic name is required')
      self.log.error(error)
      throw error
    }

    if (typeof topic !== 'string' && typeof topic !== 'number') {
      const error = new Errors.HemeraError(
        `Topic must be from type string or number but got '${typeof topic}'`
      )
      self.log.error(error)
      throw error
    }

    if (typeof topic === 'string') {
      const subId = self._topics.get(topic)

      if (subId) {
        self._transport.unsubscribe(subId, maxMessages)
        self.log.debug(`Topic '${topic}' was unsubscribed!`)
        // we remove all subscription related to this topic
        this.cleanTopic(topic)
        return true
      }
    } else {
      self._transport.unsubscribe(topic, maxMessages)
    }

    return false
  }

  /**
   * Remove topic from list and remove all patterns from index
   *
   * @param {any} topic
   * @memberof Hemera
   */
  cleanTopic(topic) {
    // release topic so we can add it again
    this._topics.delete(topic)
    // remove pattern which belongs to the topic
    this.list().forEach(add => {
      // stringify to handle regular expressions
      if (add.transport.topic === topic) {
        this.router.remove(add.pattern)
      }
    })
  }

  /**
   * The topic is subscribed on NATS and can be called from any client.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add(pattern, cb) {
    if (!pattern) {
      const error = new Errors.HemeraError('Pattern is required to define a server action')
      this.log.error(error)
      throw error
    }

    // check for use quick syntax for JSON objects
    if (typeof pattern === 'string') {
      pattern = TinySonic(pattern)
    }

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      const error = new Errors.HemeraError(
        'Topic is required and must be from type string',
        this.errorDetails
      )
      this.log.error(error)
      throw error
    }

    const schema = Util.extractSchema(pattern)
    const patternOnly = Util.cleanPattern(pattern)

    const addDefinition = new Add({
      schema,
      pattern: patternOnly,
      transport: {
        topic: pattern.topic,
        pubsub: pattern.pubsub$,
        maxMessages: pattern.maxMessages$,
        queue: pattern.queue$
      }
    })

    if (cb) {
      // set callback
      addDefinition.action = cb
    }

    // Support full / token wildcards in subject
    // Convert nats wildcard tokens to RegexExp
    addDefinition.pattern.topic = Util.natsWildcardToRegex(patternOnly.topic)

    const handler = this._router.lookup(addDefinition.pattern)

    // check if pattern is already registered
    if (this._config.bloomrun.lookupBeforeAdd && handler) {
      const error = new Errors.HemeraError('Pattern is already in use', {
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
    // it's not possible to susbcribe to the same topic with different transport options
    // because we use one NATS subscription for the topic
    const def = this._checkForTransportCollision(addDefinition)
    if (def) {
      this.log.error(
        'Topic is already registered with special transport options. Please use a different topic name.',
        Util.pattern(def.pattern)
      )
      throw new Errors.HemeraError('Topic is already registered with special transport options')
    }

    // add to bloomrun
    this._router.add(patternOnly, addDefinition)

    this.log.info(patternOnly, 'Server action added')

    const sid = this.subscribe(addDefinition)

    if (sid > 0) {
      addDefinition.sid = sid
      // stringify to handle regular expressions
      this._topics.set(addDefinition.transport.topic, sid)
    }

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
    runExt(
      this._onAddHandlers,
      (fn, state, next) => {
        fn(addDefinition)
        next()
      },
      this,
      () => {}
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
    const mT2 = addDefinition.transport
    for (const def of this._router) {
      const mT1 = def.transport
      // looking for another pattern with same topic but
      // different transport options
      if (addDefinition.transport.topic === def.transport.topic) {
        if (mT1.maxMessages !== mT2.maxMessages || mT1.queue !== mT2.queue || mT1.pubsub !== mT2.pubsub) {
          return def
        }
      }
    }
    return null
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
    self.response.payload = res.value
    self.response.error = res.error

    // decoding error
    if (self.response.error) {
      const internalError = new Errors.ParseError('Client payload decoding', self.errorDetails).causedBy(
        self.response.error
      )
      self.log.error(internalError)
      self._execute(self.response.error)
      return
    }

    if (self._extensionManager.onActFinished.length) {
      runExt(self._extensionManager.onActFinished, clientExtIterator, self, err =>
        self._onActFinishedCallback(err)
      )
      return
    }

    self._onActFinishedCallback()
  }

  /**
   *
   *
   * @param {any} extensionError
   * @memberof Hemera
   */
  _onActFinishedCallback(extensionError) {
    const self = this

    if (extensionError) {
      const error = self.getRootError(extensionError)
      const internalError = new Errors.HemeraError('onActFinished extension', self.errorDetails).causedBy(
        extensionError
      )
      self.log.error(internalError)
      self._execute(error)
      return
    }

    if (self.response.payload.error) {
      const error = Errio.fromObject(self.response.payload.error)
      self._execute(error)
      return
    }

    // call act handler
    self._execute(null, self.response.payload.result)
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
      const error = new Errors.HemeraError('Pattern is required to start a request')
      this.log.error(error)
      throw error
    }

    // check for use quick syntax for JSON objects
    if (typeof pattern === 'string') {
      pattern = TinySonic(pattern)
    }

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      const error = new Errors.HemeraError(
        'Topic is required and must be from type string',
        this.errorDetails
      )
      this.log.error(error)
      throw error
    }

    // create new execution context
    const hemera = this.createContext()
    hemera._pattern = pattern
    hemera._parentContext = this
    hemera._cleanPattern = Util.cleanFromSpecialVars(pattern)
    hemera._isServer = false
    hemera._execute = null

    hemera.response = new ClientResponse()
    hemera.request = new ClientRequest(pattern)
    hemera.sid = 0

    if (cb) {
      hemera._execute = cb.bind(hemera)
      if (hemera._extensionManager.onAct.length) {
        runExt(hemera._extensionManager.onAct, clientExtIterator, hemera, err => hemera._onActCallback(err))
        return
      }
      hemera._onActCallback()
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

      if (hemera._extensionManager.onAct.length) {
        runExt(hemera._extensionManager.onAct, clientExtIterator, hemera, err => hemera._onActCallback(err))
      } else {
        hemera._onActCallback()
      }

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
  _onActCallback(err) {
    const self = this
    const m = self._clientEncoder(self._message)

    self.request.payload = m.value

    // encoding issue
    if (m.error) {
      self.request.payload = null
      self.request.error = m.error
      const error = new Errors.ParseError('Client payload encoding').causedBy(m.error)
      self.log.error(error)
      self._execute(m.error)
      return
    }

    if (err) {
      const error = self.getRootError(err)
      self.request.payload = null
      self.request.error = error
      const internalError = new Errors.HemeraError('onAct extension').causedBy(err)
      self.log.error(internalError)
      self._execute(error)
      return
    }

    // use simple publish mechanism instead of request/reply
    if (self._pattern.pubsub$ === true) {
      self._transport.send(self._pattern.topic, self.request.payload, err => self._execute(err))
    } else {
      const optOptions = {
        timeout: self._pattern.timeout$ || self.config.timeout,
        // default is request-reply semantic but we can assign -1 (no limit)
        // but the user has to unsubscribe it manually
        max: 1
      }
      // limit on the number of responses the requestor may receive
      // support maxMessages$ -1
      if (typeof self._pattern.maxMessages$ === 'number' || self._pattern.expectedMessages$ > 0) {
        // we can't receive more messages than "expected" messages
        // the inbox is closed automatically
        optOptions.max = self._pattern.expectedMessages$ || self._pattern.maxMessages$
      }
      // send request
      self.sid = self._transport.sendRequest(self._pattern.topic, self.request.payload, optOptions, resp =>
        self._sendRequestHandler(resp)
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

    const error = new Errors.TimeoutError('Client timeout', self.errorDetails)
    self.log.error(error)
    self.response.error = error

    if (self._extensionManager.onActFinished.length) {
      runExt(self._extensionManager.onActFinished, clientExtIterator, self, err =>
        self._onActTimeoutCallback(err)
      )
      return
    }
    self._onActTimeoutCallback()
  }

  /**
   *
   *
   * @param {any} err
   * @memberof Hemera
   */
  _onActTimeoutCallback(err) {
    const self = this

    if (err) {
      const error = self.getRootError(err)
      const internalError = new Errors.HemeraError('onActFinished extension').causedBy(err)
      self.log.error(internalError)
      self.response.error = error
    }

    self._execute(self.response.error)
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
    for (const topic of this._topics.keys()) {
      this.remove(topic)
    }
  }

  /**
   *
   *
   * @memberof Hemera
   */
  close(func) {
    // 2. clean hemera
    this.onShutdown((instance, done) => {
      this._heavy.stop()
      done()
    })

    // 1. clean nats
    this.onShutdown((instance, done) => {
      this.removeAll()
      this._transport.flush(() => {
        this._transport.close()
        done()
      })
    })

    return this.shutdown(func)
  }
}

module.exports = Hemera
