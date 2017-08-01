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
const Hoek = require('hoek')
const Heavy = require('heavy')
const _ = require('lodash')
const Pino = require('pino')
const TinySonic = require('tinysonic')
const SuperError = require('super-error')
const Co = require('co')
const Joi = require('joi')

const BeforeExit = require('./beforeExit')
const Errors = require('./errors')
const Constants = require('./constants')
const Extension = require('./extension')
const ServerExtension = require('./serverExtension')
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
const Add = require('./add')
const Plugin = require('./plugin')

// Extension finish handler
const onServerPreResponse = require('./onServerPreResponse')
const onServerPreRequest = require('./onServerPreRequest')
const onClientTimeoutPostRequest = require('./onClientTimeoutPostRequest')
const onPreRequest = require('./onPreRequest')
const onClientPostRequest = require('./onClientPostRequest')
const onClose = require('./onClose')

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
    this._pluginRegistrations = []
    this._decorations = {}
    // create reference to root hemera instance
    this._root = this

    // contains the list of all registered plugins
    // the core is also a plugin
    this._plugins = {
      core: this.plugin$
    }

    this._encoderPipeline = new CodecPipeline().add(DefaultEncoder.encode)
    this._decoderPipeline = new CodecPipeline().add(DefaultDecoder.decode)

    // define extension points
    this._extensions = {
      onClientPreRequest: new Extension('onClientPreRequest'),
      onClientPostRequest: new Extension('onClientPostRequest'),
      onServerPreHandler: new ServerExtension('onServerPreHandler'),
      onServerPreRequest: new ServerExtension('onServerPreRequest'),
      onServerPreResponse: new ServerExtension('onServerPreResponse'),
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
    // will be executed after the client has received and decoded the request
    this._extensions.onClientPostRequest.add(DefaultExtensions.onClientPostRequest)
    // will be executed before the server has received the requests
    this._extensions.onServerPreRequest.add(DefaultExtensions.onServerPreRequest)
    // will be executed before the server action is executed
    this._extensions.onServerPreHandler.add(DefaultExtensions.onServerPreHandler)
    // will be executed before the server has replied the response and build the message
    this._extensions.onServerPreResponse.add(DefaultExtensions.onServerPreResponse)

    // use own logger
    if (this._config.logger) {
      this.log = this._config.logger
    } else {
      if (this._config.prettyLog) {
        let pretty = Pino.pretty()
        this.log = Pino({
          name: this._config.name,
          safe: true, // avoid error caused by circular references
          level: this._config.logLevel,
          serializers: Serializers
        }, pretty)

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
            return reject(err)
          }
          resolve()
        })
      })
    })

    this._beforeExit.init()
  }

  /**
   *
   *
   * @readonly
   * @memberof Hemera
   */
  get decoder () {
    return this._decoderPipeline
  }

  /**
   *
   *
   * @readonly
   * @memberof Hemera
   */
  get encoder () {
    return this._encoderPipeline
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
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal () {
    this._beforeExit.doActions('fatal')
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

    let m = this._encoderPipeline.run(message, this)

    // attach encoding issues
    if (m.error) {
      let internalError = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR).causedBy(m.error)
      message.error = Errio.toObject(internalError)
      message.result = null
      // Retry to encode with issue perhaps the reason was data related
      m = this._encoderPipeline.run(message, this)
      this.log.error(internalError)
      this.emit('serverResponseError', m.error)
    }

    // final response
    this._message = m.value
  }

  /**
   * Last step before the response is send to the callee.
   * The preResponse extension is dispatched and previous errors are evaluated.
   *
   * @memberOf Hemera
   */
  finish () {
    this._extensions.onServerPreResponse
      .dispatch(this, (err, val) => onServerPreResponse(this, err, val))
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

      ctx._extensions.onServerPreRequest
        .dispatch(ctx, (err, val) => onServerPreRequest(ctx, err, val))
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
   * Unsubscribe a topic or subscription id from NATS and Hemera
   *
   * @param {any} topic
   * @param {any} maxMessages
   * @returns
   *
   * @memberOf Hemera
   */
  remove (topic, maxMessages) {
    const self = this

    if (!topic) {
      let error = new Errors.HemeraError(Constants.TOPIC_SID_REQUIRED_FOR_DELETION)
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
  cleanTopic (topic) {
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
    this.subscribe(
      pattern.topic,
      pattern.pubsub$,
      pattern.maxMessages$,
      pattern.queue$)

    return addDefinition
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
    const res = self._decoderPipeline.run(response, self)
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

      self._extensions.onClientPostRequest.dispatch(self, (err) => onClientPostRequest(self, err))
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

    ctx._extensions.onClientPreRequest.dispatch(ctx, (err) => onPreRequest(ctx, err))

    return promise
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
  handleTimeout () {
    const self = this
    const timeout = self._pattern.timeout$ || this._config.timeout

    let timeoutHandler = () => {
      const error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR, self.errorDetails)
      self.log.error(error)
      self._response.error = error
      self.emit('clientResponseError', error)
      self._extensions.onClientPostRequest.dispatch(self, (err) => onClientTimeoutPostRequest(self, err))
    }

    self._transport.timeout(self._sid, timeout, 1, timeoutHandler)
  }

  /**
   * Create new instance of hemera but based on the current prototype
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
   * Remove all registered pattern and release topic from NATS
   *
   * @memberof Hemera
   */
  removeAll () {
    _.each(this._topics, (val, key) => this.remove(key))
  }

  /**
   * Gracefully shutdown of all resources.
   * Unsubscribe all subscriptiuons and close the underlying NATS connection
   *
   * @param {any} cb
   * @memberof Hemera
   */
  close (cb) {
    this._extensions.onClose.dispatch(this, (err, val) => onClose(this, err, val, cb))
  }
}

module.exports = Hemera
