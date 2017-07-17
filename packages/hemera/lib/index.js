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
const Os = require('os')
const Bloomrun = require('bloomrun')
const Errio = require('errio')
const Hoek = require('hoek')
const Heavy = require('heavy')
const _ = require('lodash')
const Pino = require('pino')
const TinySonic = require('tinysonic')
const SuperError = require('super-error')
const Co = require('co')

const BeforeExit = require('./beforeExit')
const Errors = require('./errors')
const Constants = require('./constants')
const Extension = require('./extension')
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
const Add = require('./add')
const Plugin = require('./plugin')

var defaultConfig = {
  timeout: 2000, // Max execution time of a request
  pluginTimeout: 3000, // Max intialization time for a plugin
  tag: '', // The tag string of this Hemera instance
  name: `hemera-${Os.hostname()}-${Util.randomId()}`, // node name
  crashOnFatal: true, // Should gracefully exit the process at unhandled exceptions or fatal errors
  logLevel: 'silent', // 'fatal', 'error', 'warn', 'info', 'debug', 'trace'; also 'silent'
  childLogger: false, // Create a child logger per section / plugin. Only possible with default logger Pino.
  maxRecursion: 0, // Max recursive method calls
  errio: {
    recursive: true, // Recursively serialize and deserialize nested errors
    inherited: true, // Include inherited properties
    stack: true,    // Include stack property
    private: false,  // Include properties with leading or trailing underscores
    exclude: [],     // Property names to exclude (low priority)
    include: []      // Property names to include (high priority)
  },
  bloomrun: {
    indexing: 'inserting', // Pattern indexing method "inserting" or "depth"
    lookupBeforeAdd: true // Checks if the pattern is no duplicate based on to the indexing strategy
  },
  load: {
    checkPolicy: true, // Check on every request (server) if the load policy was observed,
    shouldCrash: true, // Should gracefully exit the process to recover from memory leaks or load, crashOnFatal must be enabled
    process: {
      sampleInterval: 0  // Frequency of load sampling in milliseconds (zero is no sampling)
    },
    policy: {
      maxHeapUsedBytes: 0,  // Reject requests when V8 heap is over size in bytes (zero is no max)
      maxRssBytes: 0,       // Reject requests when process RSS is over size in bytes (zero is no max)
      maxEventLoopDelay: 0  // Milliseconds of delay after which requests are rejected (zero is no max)
    }
  },
  circuitBreaker: {
    enabled: false,
    minSuccesses: 1, // Minimum successes in the half-open state to change to close state
    halfOpenTime: 5 * 1000, // The duration when the server is ready to accept further calls after changing to open state
    resetIntervalTime: 15 * 1000, // Frequency of reseting the circuit breaker to close state in milliseconds
    maxFailures: 3 // The threshold when the circuit breaker change to open state
  }
}

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
  constructor (transport, params) {
    super()

    this._config = Hoek.applyToDefaults(defaultConfig, params || {})
    this._router = Bloomrun(this._config.bloomrun)
    this._heavy = new Heavy(this._config.load.process)
    this._transport = new NatsTransport({
      transport
    })
    this._topics = {}
    this._exposition = {}

    // special variables for the new execution context
    this.context$ = {}
    this.meta$ = {}
    this.delegate$ = {}
    this.auth$ = {}
    this.plugin$ = new Plugin({
      options: {},
      attributes: {
        name: 'core'
      }
    })
    this.trace$ = {}
    this.request$ = {
      duration: 0,
      parentId: '',
      timestamp: 0,
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
    this._pluginRegistrations = []
    this._decorations = {}
    // create reference to root hemera instance
    this._root = this

    // contains the list of all registered plugins
    // the core is also a plugin
    this._plugins = {
      core: this.plugin$
    }

    this._encoder = {
      encode: DefaultEncoder.encode
    }
    this._decoder = {
      decode: DefaultDecoder.decode
    }

    // define extension points
    this._extensions = {
      onClientPreRequest: new Extension('onClientPreRequest'),
      onClientPostRequest: new Extension('onClientPostRequest'),
      onServerPreHandler: new Extension('onServerPreHandler'),
      onServerPreRequest: new Extension('onServerPreRequest'),
      onServerPreResponse: new Extension('onServerPreResponse'),
      onClose: new Extension('onClose')
    }

    // errio settings
    Errio.setDefaults(this._config.errio)

    // create load policy
    this._loadPolicy = this._heavy.policy(this._config.load.policy)

    // start tracking process stats
    this._heavy.start()

    // contains the list of circuit breaker of all act calls
    this._circuitBreakerMap = new Map()

    // will be executed before the client request is executed.
    this._extensions.onClientPreRequest.add(DefaultExtensions.onClientPreRequest)
    // will be executed after the client received and decoded the request
    this._extensions.onClientPostRequest.add(DefaultExtensions.onClientPostRequest)
    // will be executed before the server received the requests
    this._extensions.onServerPreRequest.add(DefaultExtensions.onServerPreRequest)
    // will be executed before the server action is executed
    this._extensions.onServerPreHandler.add(DefaultExtensions.onServerPreHandler)
    // will be executed before the server reply the response and build the message
    this._extensions.onServerPreResponse.add(DefaultExtensions.onServerPreResponse)

    // use own logger
    if (this._config.logger) {
      this.log = this._config.logger
    } else {
      let pretty = Pino.pretty()

      // Leads to too much listeners in tests
      if (this._config.logLevel !== 'silent') {
        pretty.pipe(process.stdout)
      }

      this.log = Pino({
        name: this._config.name,
        safe: true, // avoid error caused by circular references
        level: this._config.logLevel,
        serializers: Serializers
      }, pretty)
    }

    this._beforeExit = new BeforeExit()

    this._beforeExit.addAction((signal) => {
      this.log.fatal({
        signal
      }, 'process exited')
      this.emit('exit', {
        signal
      })
    })

    this._beforeExit.addAction(() => {
      return new Promise((resolve, reject) => {
        this.close((err) => {
          if (err) {
            this.log.error(err)
            return reject(err)
          }
          resolve()
        })
      })
    })

    this._beforeExit.init()
  }

  /**
   * Return all registered plugins
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get plugins () {
    return this._plugins
  }

  /**
   * Return the bloomrun instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get router () {
    return this._router
  }

  /**
   * Return the heavy instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get load () {
    return this._heavy.load
  }

  /**
   * Return the shared object of all exposed data
   *
   * @readonly
   * @type {Exposition}
   * @memberOf Hemera
   */
  get exposition () {
    return this._exposition
  }

  /**
   * Exposed data in context of the current plugin
   * It is accessible by this.expositions[<plugin>][<key>]
   *
   * @param {string} key
   * @param {mixed} object
   *
   * @memberOf Hemera
   */
  expose (key, object) {
    let pluginName = this.plugin$.attributes.name

    if (!this._exposition[pluginName]) {
      this._exposition[pluginName] = {}
      this._exposition[pluginName][key] = object
    } else {
      this._exposition[pluginName][key] = object
    }
  }

  /**
   * Return the underlying NATS driver
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get transport () {
    return this._transport.driver
  }

  /**
   * Return all registered topics
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get topics () {
    return this._topics
  }

  /**
   * Add an extension. Extensions are called in serie
   *
   * @param {any} type
   * @param {any} handler
   *
   * @memberOf Hemera
   */
  ext (type, handler) {
    if (!this._extensions[type]) {
      let error = new Errors.HemeraError(Constants.INVALID_EXTENSION_TYPE, {
        type
      })
      this.log.error(error)
      this.emit('error', error)
    }

    this._extensions[type].add(handler)
  }

  /**
   * Use a plugin.
   *
   * @param {any} plugin
   *
   * @memberOf Hemera
   */
  use (params, options) {
    // use plugin infos from package.json
    if (_.isObject(params.attributes.pkg)) {
      params.attributes = params.attributes || {}
      params.attributes = Hoek.applyToDefaults(params.attributes, _.pick(params.attributes.pkg, ['name', 'description', 'version']))
    }

    let pluginOptions = {}

    // pass options as second argument during plugin registration
    if (_.isObject(options)) {
      pluginOptions = Hoek.clone(params.options) || {}
      pluginOptions = Hoek.applyToDefaults(pluginOptions, options)
    } else if (params.options) {
      pluginOptions = Hoek.clone(params.options)
    }

    // plugin name is required
    if (!params.attributes.name) {
      let error = new Errors.HemeraError(Constants.PLUGIN_NAME_REQUIRED)
      this.log.error(error)
      this.emit('error', error)
      return
    }

    // create new execution context
    let ctx = this.createContext()

    const plugin = new Plugin({
      register: params.plugin.bind(ctx),
      attributes: params.attributes,
      parentPluginName: this.plugin$.attributes.name,
      options: pluginOptions
    })

    ctx.plugin$ = plugin

    if (ctx._config.childLogger) {
      ctx.log = this.log.child({ plugin: plugin.attributes.name })
    }

    this._pluginRegistrations.push(plugin)

    this.log.info(params.attributes.name, Constants.PLUGIN_ADDED)
    this._plugins[params.attributes.name] = plugin
  }

  /**
   * Change the current plugin configuration
   * e.g to set the payload validator
   *
   * @param {any} options
   *
   * @memberOf Hemera
   */
  setOption (key, value) {
    this.plugin$.options[key] = value
  }

  /**
   * Change the base configuration.
   *
   *
   * @memberOf Hemera
   */
  setConfig (key, value) {
    this._config[key] = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get config () {
    return this._config
  }
  /**
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal () {
    this._beforeExit.doActions('fatal')
  }

  /**
   * Create a custom super error object without to start hemera
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  static createError (name) {
    return SuperError.subclass(name)
  }

  /**
   * Decorate the root instance
   * Value is globaly accesible
   *
   * @param {any} prop
   * @param {any} value
   *
   * @memberOf Hemera
   */
  decorate (prop, value) {
    if (this._decorations[prop]) {
      this.emit('error', new Error(Constants.DECORATION_ALREADY_DEFINED))
    } else if (this[prop]) {
      this.emit('error', new Error(Constants.OVERRIDE_BUILTIN_METHOD_NOT_ALLOWED))
    }

    this._decorations[prop] = {
      plugin: this.plugin$,
      value
    }
    // decorate root hemera instance
    this._root[prop] = value
  }

  /**
   * Create a custom super error object in a running hemera instance
   *
   * @param {any} name
   * @returns
   *
   * @memberOf Hemera
   */
  createError (name) {
    return SuperError.subclass(name)
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Hemera
   */
  get errorDetails () {
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
  static get errors () {
    return Errors
  }

  /**
   *
   *
   * @param {any} plugins
   * @param {any} cb
   * @memberof Hemera
   */
  registerPlugins (cb) {
    const each = (item, next) => {
      // plugin has no callback
      if (item.register.length < 2) {
        item.register(item.options)
        return next()
      }

      // Detect plugin timeouts
      const pluginTimer = setTimeout(() => {
        const internalError = new Errors.PluginTimeoutError(Constants.PLUGIN_TIMEOUT_ERROR)
        this.log.error(internalError, `Plugin: ${item.attributes.name}`)
        next(internalError)
      }, this._config.pluginTimeout)

      item.register(item.options, (err) => {
        clearTimeout(pluginTimer)
        next(err)
      })
    }

    // register all plugins in serie
    Util.serial(this._pluginRegistrations, each, (err) => {
      if (err) {
        if (err instanceof SuperError) {
          err = err.rootCause || err.cause || err
        }
        const internalError = new Errors.HemeraError(Constants.PLUGIN_REGISTRATION_ERROR).causedBy(err)
        this.log.error(internalError)
        this.emit('error', internalError)
      } else if (_.isFunction(cb)) {
        cb.call(this)
      }
    })
  }

  /**
   *
   *
   * @param {Function} cb
   *
   * @memberOf Hemera
   */
  ready (cb) {
    this._transport.driver.on('error', (err) => {
      this.log.error(err, Constants.NATS_TRANSPORT_ERROR)
      this.log.error('NATS Code: \'%s\', Message: %s', err.code, err.message)

      // Exit only on connection issues.
      // Authorization and protocol issues don't lead to process termination
      if (Constants.NATS_CONN_ERROR_CODES.indexOf(err.code) > -1) {
        // We have no NATS connection and can only gracefully shutdown hemera
        this.close()
      }
    })

    this._transport.driver.on('permission_error', (err) => {
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
      this.registerPlugins(cb)
    })
  }

  /**
   * Build the final payload for the response
   *
   *
   * @memberOf Hemera
   */
  _buildMessage () {
    let result = this._response

    let message = {
      meta: this.meta$ || {},
      trace: this.trace$ || {},
      request: this.request$,
      result: result.error ? null : result.payload,
      error: result.error ? Errio.toObject(result.error) : null
    }

    let diff = Util.nowHrTime() - message.request.timestamp
    // calculate request duration
    message.request.duration = diff
    message.trace.duration = diff

    let m = this._encoder.encode.call(this, message)

    // attach encoding issues
    if (m.error) {
      message.error = Errio.toObject(m.error)
      message.result = null
    }

    // final response
    this._message = m.value
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} value
   * @returns
   *
   * @memberof Hemera
   */
  _onServerPreResponseHandler (err, value) {
    const self = this

      // check if an error was already wrapped
    if (self._response.error) {
      self.emit('serverResponseError', self._response.error)
      self.log.error(self._response.error)
    } else if (err) { // check for an extension error
      if (err instanceof SuperError) {
        self._response.error = err.rootCause || err.cause || err
      } else {
        self._response.error = err
      }

      const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, self.errorDetails).causedBy(err)
      self.log.error(internalError)
      self.emit('serverResponseError', self._response.error)
    }

      // reply value from extension
    if (value) {
      self._response.payload = value
    }

      // create message payload
    self._buildMessage()

      // indicates that an error occurs and that the program should exit
    if (self._shouldCrash) {
        // only when we have an inbox othwerwise exit the service immediately
      if (self._replyTo) {
          // send error back to callee
        return self._transport.send(self._replyTo, self._message, () => {
            // let it crash
          if (self._config.crashOnFatal) {
            self.fatal()
          }
        })
      } else if (self._config.crashOnFatal) {
        return self.fatal()
      }
    }

      // reply only when we have an inbox
    if (self._replyTo) {
      return this._transport.send(this._replyTo, self._message)
    }
  }

  /**
   * Last step before the response is send to the callee.
   * The preResponse extension is dispatched and previous errors are evaluated.
   *
   * @memberOf Hemera
   */
  finish () {
    this._extensions.onServerPreResponse.dispatch(this, (err, val) => this._onServerPreResponseHandler(err, val))
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
  _actionHandler (err, resp) {
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

      if (err instanceof SuperError) {
        self._response.error = err.rootCause || err.cause || err
      } else {
        self._response.error = err
      }

      return self.finish()
    }

      // assign action result
    self._response.payload = resp
      // delete error we have payload
    self._response.error = null

    self.finish()
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} value
   * @returns
   *
   * @memberof Hemera
   */
  _onServerPreHandler (err, value) {
    const self = this

    if (err) {
      if (err instanceof SuperError) {
        self._response.error = err.rootCause || err.cause || err
      } else {
        self._response.error = err
      }

      const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, self.errorDetails).causedBy(err)
      self.log.error(internalError)

      return self.finish()
    }

      // reply value from extension
    if (value) {
      self._response.payload = value
      return self.finish()
    }

    try {
      let action = self._actMeta.action.bind(self)

      self._actMeta.dispatch(self._request, self._response, (err) => {
          // middleware error
        if (err) {
          if (err instanceof SuperError) {
            self._response.error = err.rootCause || err.cause || err
          } else {
            self._response.error = err
          }

          const internalError = new Errors.HemeraError(Constants.ADD_MIDDLEWARE_ERROR, self.errorDetails).causedBy(err)
          self.log.error(internalError)

          return self.finish()
        }

          // if request type is 'pubsub' we dont have to reply back
        if (self._request.payload.request.type === Constants.REQUEST_TYPE_PUBSUB) {
          action(self._request.payload.pattern)
          return self.finish()
        }
          // execute RPC action
        if (self._actMeta.isPromisable) {
          action(self._request.payload.pattern)
            .then(x => self._actionHandler(null, x))
            .catch(e => self._actionHandler(e))
        } else {
          action(self._request.payload.pattern, self._actionHandler.bind(self))
        }
      })
    } catch (err) {
      if (err instanceof SuperError) {
        self._response.error = err.rootCause || err.cause || err
      } else {
        self._response.error = err
      }

        // service should exit
      self._shouldCrash = true

      self.finish()
    }
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} value
   * @returns
   *
   * @memberof Hemera
   */
  _onServerPreRequestHandler (err, value) {
    let self = this

    if (err) {
      if (err instanceof SuperError) {
        self._response.error = err.rootCause || err.cause || err
      } else {
        self._response.error = err
      }

      return self.finish()
    }

      // reply value from extension
    if (value) {
      self._response.payload = value
      return self.finish()
    }

      // check if a handler is registered with this pattern
    if (self._actMeta) {
      self._extensions.onServerPreHandler.dispatch(self, (err, val) => self._onServerPreHandler(err, val))
    } else {
      const internalError = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, self.errorDetails)
      self.log.error(internalError)
      self._response.error = internalError

        // send error back to callee
      self.finish()
    }
  }

  /**
   * Attach one handler to the topic subscriber.
   * With subToMany and maxMessages you control NATS specific behaviour.
   *
   * @param {string} topic
   * @param {boolean} subToMany
   * @param {number} maxMessages
   * @param {string} queue
   *
   * @memberOf Hemera
   */
  subscribe (topic, subToMany, maxMessages, queue) {
    const self = this

    // avoid duplicate subscribers of the emit stream
    // we use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    let handler = (request, replyTo) => {
      // create new execution context
      let ctx = this.createContext()
      ctx._shouldCrash = false
      ctx._replyTo = replyTo
      ctx._topic = topic
      ctx._request = new ServerRequest(request)
      ctx._response = new ServerResponse()
      ctx._pattern = {}
      ctx._actMeta = {}
      ctx._isServer = true

      ctx._extensions.onServerPreRequest.dispatch(ctx, (err, val) => ctx._onServerPreRequestHandler(err, val))
    }

    // standard pubsub with optional max proceed messages
    if (subToMany) {
      self._topics[topic] = self._transport.subscribe(topic, {
        max: maxMessages
      }, handler)
    } else {
      const queueGroup = queue || `${Constants.NATS_QUEUEGROUP_PREFIX}.${topic}`
      // queue group names allow load balancing of services
      self._topics[topic] = self._transport.subscribe(topic, {
        'queue': queueGroup,
        max: maxMessages
      }, handler)
    }
  }

  /**
   * Unsubscribe a topic or subscription id from NATS
   *
   * @param {any} topic
   * @param {any} maxMessages
   * @returns
   *
   * @memberOf Hemera
   */
  remove (topic, maxMessages) {
    const self = this

    if (_.isNumber(topic)) {
      self._transport.unsubscribe(topic, maxMessages)
      return true
    } else if (_.isString(topic)) {
      const subId = self._topics[topic]
      if (subId) {
        self._transport.unsubscribe(subId, maxMessages)
        // release topic
        delete self._topics[topic]
        return true
      }
    }

    return false
  }

  /**
   * The topic is subscribed on NATS and can be called from any client.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add (pattern, cb) {
    // check for use quick syntax for JSON objects
    if (_.isString(pattern)) {
      pattern = TinySonic(pattern)
    }

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_SUBSCRIBE, {
        pattern,
        app: this._config.name
      })

      this.log.error(error)
      this.emit('error', error)
    }

    let origPattern = _.cloneDeep(pattern)
    let schema = Util.extractSchema(origPattern)
    origPattern = Util.cleanPattern(origPattern)

    const actMeta = {
      schema: schema,
      pattern: origPattern,
      plugin: this.plugin$
    }

    let addDefinition = new Add(actMeta)

    // cb is null when we use chaining syntax
    if (cb) {
    // set callback
      addDefinition.action = cb
    }

    // Support full / token wildcards in subject
    const bloomrunPattern = _.clone(origPattern)
    // Convert nats wildcard tokens to RegexExp
    bloomrunPattern.topic = Util.natsWildcardToRegex(bloomrunPattern.topic)

    let handler = this._router.lookup(bloomrunPattern)

    // check if pattern is already registered
    if (this._config.bloomrun.lookupBeforeAdd && handler) {
      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern
      })

      this.log.error({
        pattern
      }, error)
      this.emit('error', error)
    }

    // add to bloomrun
    this._router.add(bloomrunPattern, addDefinition)

    this.log.info(origPattern, Constants.ADD_ADDED)

    // subscribe on topic
    this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$, pattern.queue$)

    return addDefinition
  }

  /**
   *
   *
   * @param {any} err
   *
   * @memberof Hemera
   */
  _onClientPostRequestHandler (err) {
    const self = this
      // extension error
    if (err) {
      let error = null
      if (err instanceof SuperError) {
        error = err.rootCause || err.cause || err
      } else {
        error = err
      }
      const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, self.errorDetails).causedBy(err)
      self.log.error(internalError)
      self.emit('clientResponseError', error)

      self._execute(error)
      return
    }

    if (self._response.payload.error) {
      let error = Errio.fromObject(self._response.payload.error)

      const internalError = new Errors.BusinessError(Constants.BUSINESS_ERROR, self.errorDetails).causedBy(error)
      self.log.error(internalError)
      self.emit('clientResponseError', error)

      self._execute(error)
      return
    }

    self._execute(null, self._response.payload.result)
  }

  /**
   *
   *
   * @param {any} response
   *
   * @memberof Hemera
   */
  _sendRequestHandler (response) {
    const self = this
    const res = self._decoder.decode.call(self, response)
    self._response.payload = res.value
    self._response.error = res.error

    try {
        // decoding error
      if (self._response.error) {
        let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, self.errorDetails).causedBy(self._response.error)
        self.log.error(error)
        self.emit('clientResponseError', error)

        self._execute(error)
        return
      }

      self._extensions.onClientPostRequest.dispatch(self, (err) => self._onClientPostRequestHandler(err))
    } catch (err) {
      let error = null
      if (err instanceof SuperError) {
        error = err.rootCause || err.cause || err
      } else {
        error = err
      }

      const internalError = new Errors.FatalError(Constants.FATAL_ERROR, self.errorDetails).causedBy(err)
      self.log.fatal(internalError)
      self.emit('clientResponseError', error)

        // let it crash
      if (self._config.crashOnFatal) {
        self.fatal()
      }
    }
  }

  /**
   *
   *
   * @param {any} err
   *
   * @memberof Hemera
   */
  _onPreRequestHandler (err) {
    const self = this

    let m = self._encoder.encode.call(self, self._message)

      // encoding issue
    if (m.error) {
      let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR).causedBy(m.error)
      self.log.error(error)
      self.emit('clientResponseError', error)

      self._execute(error)
      return
    }

    if (err) {
      let error = null
      if (err instanceof SuperError) {
        error = err.rootCause || err.cause || err
      } else {
        error = err
      }
      const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
      self.log.error(internalError)
      self.emit('clientResponseError', error)
      self._execute(error)
      return
    }

    self._request.payload = m.value
    self._request.error = m.error

      // use simple publish mechanism instead of request/reply
    if (self._pattern.pubsub$ === true) {
      if (self._actCallback) {
        self.log.info(Constants.PUB_CALLBACK_REDUNDANT)
      }

      self._transport.send(self._pattern.topic, self._request.payload)
    } else {
      const optOptions = {}
        // limit on the number of responses the requestor may receive
      if (self._pattern.maxMessages$ > 0) {
        optOptions.max = self._pattern.maxMessages$
      } else if (self._pattern.maxMessages$ !== -1) {
        optOptions.max = 1
      }
        // send request
      self._sid = self._transport.sendRequest(self._pattern.topic, self._request.payload, optOptions, self._sendRequestHandler.bind(self))

        // handle timeout
      self.handleTimeout()
    }
  }

  /**
   * Start an action.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  act (pattern, cb) {
    // check for use quick syntax for JSON objects
    if (_.isString(pattern)) {
      pattern = TinySonic(pattern)
    }

    // create new execution context
    let ctx = this.createContext()
    ctx._pattern = pattern
    ctx._prevContext = this
    ctx._cleanPattern = Util.cleanFromSpecialVars(pattern)
    ctx._response = new ClientResponse()
    ctx._request = new ClientRequest()
    ctx._isServer = false
    ctx._execute = null
    ctx._hasCallback = false
    ctx._isPromisable = false

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_REQUEST, ctx.errorDetails)

      this.log.error(error)
      this.emit('error', error)
    }

    if (cb) {
      ctx._hasCallback = true

      if (Util.isGeneratorFunction(cb)) {
        ctx._actCallback = Co.wrap(cb.bind(ctx))
        ctx._isPromisable = true
      } else if (Util.isAsyncFunction(cb)) {
        ctx._actCallback = cb.bind(ctx)
        ctx._isPromisable = true
      } else {
        ctx._actCallback = cb.bind(ctx)
        ctx._isPromisable = false
      }
    }

    const promise = new Promise((resolve, reject) => {
      ctx._execute = (err, result) => {
        if (ctx._config.circuitBreaker.enabled) {
          const circuitBreaker = ctx._circuitBreakerMap.get(ctx.trace$.method)
          if (err) {
            circuitBreaker.failure()
          } else {
            circuitBreaker.success()
          }
        }

        if (ctx._hasCallback) {
          if (ctx._isPromisable) {
            ctx._actCallback(err, result)
              .then(x => resolve(x))
              .catch(x => reject(x))
          } else {
            // any return value in a callback function will fullfilled the
            // promise but an error will reject it
            const r = ctx._actCallback(err, result)
            if (r instanceof Error) {
              reject(r)
            } else {
              resolve(r)
            }
          }
        } else {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      }
    })

    ctx._extensions.onClientPreRequest.dispatch(ctx, (err) => ctx._onPreRequestHandler(err))

    return promise
  }

  /**
   *
   *
   * @param {any} err
   *
   * @memberof Hemera
   */
  _onClientTimeoutPostRequestHandler (err) {
    const self = this
    if (err) {
      let error = null
      if (err instanceof SuperError) {
        error = err.rootCause || err.cause || err
      } else {
        error = err
      }

      const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
      self.log.error(internalError)
      self._response.error = error
      self.emit('clientResponseError', error)
    }

    try {
      self._execute(self._response.error)
    } catch (err) {
      let error = null
      if (err instanceof SuperError) {
        error = err.rootCause || err.cause || err
      } else {
        error = err
      }

      const internalError = new Errors.FatalError(Constants.FATAL_ERROR, self.errorDetails).causedBy(err)
      self.log.fatal(internalError)
      self.emit('clientResponseError', error)

        // let it crash
      if (self._config.crashOnFatal) {
        self.fatal()
      }
    }
  }
  /**
   * Handle the timeout when a pattern could not be resolved. Can have different reasons:
   * - No one was connected at the time (service unavailable)
   * - Service is actually still processing the request (service takes too long)
   * - Service was processing the request but crashed (service error)
   *
   * @param {any} sid
   * @param {any} pattern
   *
   * @memberOf Hemera
   */
  handleTimeout () {
    const self = this
    const timeout = self._pattern.timeout$ || this._config.timeout

    let timeoutHandler = () => {
      const error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR, self.errorDetails)
      self.log.error(error)
      self._response.error = error
      self.emit('clientResponseError', error)
      self._extensions.onClientPostRequest.dispatch(self, (err) => self._onClientTimeoutPostRequestHandler(err))
    }

    self._transport.timeout(self._sid, timeout, 1, timeoutHandler)
  }

  /**
   * Create new instance of hemera but with pointer on the previous propertys
   * so we are able to create a scope per act without lossing the reference to the core api.
   *
   * @returns
   *
   * @memberOf Hemera
   */
  createContext () {
    const self = this

    const ctx = Object.create(self)

    return ctx
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
  list (pattern, options) {
    return this._router.list(pattern, options)
  }

  /**
   *
   *
   * @memberof Hemera
   */
  removeAll () {
    _.each(this._topics, (_, topic) => this.remove(topic))
  }

  /**
   * Gracefully shutdown of all resources.
   * Close the process watcher and the underlying transport driver.
   *
   * @param {any} cb
   * @memberof Hemera
   */
  close (cb) {
    this._extensions.onClose.dispatch(this, (err, val) => {
      // no callback no queue processing
      if (!_.isFunction(cb)) {
        this._heavy.stop()
        this._transport.close()
        if (err) {
          this.log.fatal(err)
          this.emit('error', err)
        }
        return
      }

      // remove all active subscriptions
      this.removeAll()

      // Waiting before all queued messages was proceed
      // and then close hemera and nats
      this._transport.flush(() => {
        this._heavy.stop()
        this._transport.close()

        if (err) {
          this.log.fatal(err)
          this.emit('error', err)
          if (_.isFunction(cb)) {
            cb(err)
          }
        } else {
          this.log.info(Constants.GRACEFULLY_SHUTDOWN)
          if (_.isFunction(cb)) {
            cb(null, val)
          }
        }
      })
    })
  }
}

module.exports = Hemera
