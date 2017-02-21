/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * Module Dependencies
 */

import EventEmitter from 'events'
import Bloomrun from 'bloomrun'
import Errio from 'errio'
import Hoek from 'hoek'
import Heavy from 'heavy'
import _ from 'lodash'
import Pino from 'pino'
import OnExit from 'signal-exit'
import TinySonic from 'tinysonic'

import Errors from './errors'
import Constants from './constants'
import Extension from './extension'
import Util from './util'
import NatsTransport from './transport'
import * as DefaultExtensions from './extensions'
import DefaultEncoder from './encoder'
import DefaultDecoder from './decoder'
import ServerResponse from './serverResponse'
import ServerRequest from './serverRequest'
import ClientRequest from './clientRequest'
import ClientResponse from './clientResponse'
import Serializers from './serializer'
import Add from './add'

var defaultConfig = {
  timeout: 2000,
  debug: false,
  name: 'app',
  crashOnFatal: true,
  logLevel: 'silent',
  load: {
    sampleInterval: 0
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
    this._router = Bloomrun()
    this._heavy = new Heavy(this._config.load)
    this._transport = new NatsTransport({
      transport
    })
    this._topics = {}
    this._exposition = {}

    // special variables for the new execution context
    this.context$ = {}
    this.meta$ = {}
    this.delegate$ = {}
    this.plugin$ = {
      options: {
        payloadValidator: ''
      },
      attributes: {
        name: 'core'
      }
    }
    this.trace$ = {}
    this.request$ = {
      duration: 0,
      parentId: '',
      timestamp: 0,
      type: 'request',
      id: ''
    }

    // client and server locales
    this._shouldCrash = false
    this._replyTo = ''
    this._request = null
    this._response = null
    this._pattern = null
    this._actMeta = null
    this._actCallback = null
    this._cleanPattern = ''

    // contains the list of all registered plugins
    // the core is also a plugin
    this._plugins = {
      core: this.plugin$.attributes
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
      onServerPreHandler: new Extension('onServerPreHandler', true),
      onServerPreRequest: new Extension('onServerPreRequest', true),
      onServerPreResponse: new Extension('onServerPreResponse', true)
    }

    // start tracking process stats
    this._heavy.start()

    // will be executed before the client request is executed.
    this._extensions.onClientPreRequest.addRange(DefaultExtensions.onClientPreRequest)
    // will be executed after the client received and decoded the request
    this._extensions.onClientPostRequest.addRange(DefaultExtensions.onClientPostRequest)
    // will be executed before the server received the requests
    this._extensions.onServerPreRequest.addRange(DefaultExtensions.onServerPreRequest)
    // will be executed before the server action is executed
    this._extensions.onServerPreHandler.addRange(DefaultExtensions.onServerPreHandler)
    // will be executed before the server reply the response and build the message
    this._extensions.onServerPreResponse.addRange(DefaultExtensions.onServerPreResponse)

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

    // no matter how a process exits log and fire event
    OnExit((code, signal) => {
      this.log.fatal({
        code,
        signal
      }, 'process exited')
      this.emit('teardown', {
        code,
        signal
      })
      this.close()
    })
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
   * Is accessible by this.expositions[<plugin>][<key>]
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
      throw (error)
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
  use (params) {
    if (this._plugins[params.attributes.name]) {
      this.log.warn(Constants.PLUGIN_ALREADY_IN_USE, params.attributes.name, this._plugins[params.attributes.name].parentPlugin)
      return
    }

    // create new execution context
    let ctx = this.createContext()
    ctx.plugin$ = {}
    ctx.plugin$.attributes = params.attributes || {}
    ctx.plugin$.attributes.dependencies = params.attributes.dependencies || []
    ctx.plugin$.parentPlugin = this.plugin$.attributes.name
    ctx.plugin$.options = params.options || {}
    ctx.plugin$.options.payloadValidator = params.options.payloadValidator || ''

    params.plugin.call(ctx, params.options)

    this.log.info(params.attributes.name, Constants.PLUGIN_ADDED)
    this._plugins[params.attributes.name] = ctx.plugin$
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
    this.close()

    process.exit(1)
  }

  /**
   *
   *
   * @param {Function} cb
   *
   * @memberOf Hemera
   */
  ready (cb) {
    this._transport.driver.on('connect', () => {
      this.log.info(Constants.TRANSPORT_CONNECTED)

      if (_.isFunction(cb)) {
        cb.call(this)
      }
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

    let endTime = Util.nowHrTime()
    message.request.duration = endTime - message.request.timestamp
    message.trace.duration = endTime - message.request.timestamp

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
   * Last step before the response is send to the callee.
   * The preResponse extension is invoked and previous errors are evaluated.
   *
   * @memberOf Hemera
   */
  finish () {
    function onServerPreResponseHandler (err, value) {
      const self = this

      // check if an error was already catched
      if (self._response.error) {
        self.log.error(self._response.error)
      } else if (err) { // check for an extension error
        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self._response.error = error
        self.log.error(self._response.error)
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

    this._extensions.onServerPreResponse.invoke(this, onServerPreResponseHandler)
  }

  /**
   * Attach one handler to the topic subscriber.
   * With subToMany and maxMessages you control NATS specific behaviour.
   *
   * @param {string} topic
   * @param {boolean} subToMany
   * @param {number} maxMessages
   *
   * @memberOf Hemera
   */
  subscribe (topic, subToMany, maxMessages) {
    const self = this

    // avoid duplicate subscribers of the emit stream
    // we use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    /**
     *
     *
     * @param {any} err
     * @param {any} resp
     * @returns
     */
    function actionHandler (err, resp) {
      const self = this

      if (err) {
        self._response.error = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR, {
          pattern: self._pattern
        }).causedBy(err)

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
     */
    function onServerPreHandler (err, value) {
      const self = this

      if (err) {
        self._response.error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self.log.error(self._response.error)

        return self.finish()
      }

      // reply value from extension
      if (value) {
        self._response.payload = value
        return self.finish()
      }

      try {
        let action = self._actMeta.action.bind(self)

        // execute add middlewares
        Util.serial(self._actMeta.middleware, (item, next) => {
          item(self._request, self._response, next)
        }, (err) => {
          // middleware error
          if (err) {
            let error = new Errors.HemeraError(Constants.ADD_MIDDLEWARE_ERROR).causedBy(err)
            self.log.error(error)
            self._response.error = error
            return self.finish()
          }

          // if request type is 'pubsub' we dont have to reply back
          if (self._request.payload.request.type === 'pubsub') {
            action(self._request.payload.pattern)
            return self.finish()
          }

          // execute RPC action
          action(self._request.payload.pattern, actionHandler.bind(self))
        })
      } catch (err) {
        self._response.error = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR, {
          pattern: self._pattern
        }).causedBy(err)

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
     */
    function onServerPreRequestHandler (err, value) {
      let self = this

      if (err) {
        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self.log.error(error)
        self._response.error = error

        return self.finish()
      }

      // reply value from extension
      if (value) {
        self._response.payload = value
        return self.finish()
      }

      // find matched route
      self._pattern = self._request.payload.pattern
      self._actMeta = self._router.lookup(self._pattern)

      // check if a handler is registered with this pattern
      if (self._actMeta) {
        self._extensions.onServerPreHandler.invoke(self, onServerPreHandler)
      } else {
        self.log.info({
          topic
        }, Constants.PATTERN_NOT_FOUND)

        self._response.error = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, {
          pattern: self._pattern
        })

        // send error back to callee
        self.finish()
      }
    }

    let handler = (request, replyTo) => {
      // create new execution context
      let ctx = this.createContext()
      ctx._shouldCrash = false
      ctx._replyTo = replyTo
      ctx._request = new ServerRequest(request)
      ctx._response = new ServerResponse()
      ctx._pattern = {}
      ctx._actMeta = {}

      ctx._extensions.onServerPreRequest.invoke(ctx, onServerPreRequestHandler)
    }

    // standard pubsub with optional max proceed messages
    if (subToMany) {
      self._transport.subscribe(topic, {
        max: maxMessages
      }, handler)
    } else {
      // queue group names allow load balancing of services
      self._transport.subscribe(topic, {
        'queue': 'queue.' + topic,
        max: maxMessages
      }, handler)
    }

    self._topics[topic] = true
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
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    let origPattern = _.cloneDeep(pattern)

    let schema = {}

    // remove objects (rules) from pattern and extract schema
    _.each(pattern, function (v, k) {
      if (_.isObject(v)) {
        schema[k] = _.clone(v)
        delete origPattern[k]
      }
    })

    // remove special $ variables from pattern
    origPattern = Util.cleanPattern(origPattern)

    // create message object which represent the object behind the matched pattern
    let actMeta = new Add({
      schema: schema,
      pattern: origPattern,
      action: cb,
      plugin: this.plugin$
    })

    let handler = this._router.lookup(origPattern)

    // check if pattern is already registered
    if (handler) {
      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    // add to bloomrun
    this._router.add(origPattern, actMeta)

    this.log.info(origPattern, Constants.ADD_ADDED)

    // subscribe on topic
    this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$)

    return actMeta
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

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {
      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_REQUEST, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    /**
     *
     *
     * @param {any} err
     * @returns
     */
    function onClientPostRequestHandler (err) {
      const self = this
      if (err) {
        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        self.log.error(error)

        if (self._actCallback) {
          return self._actCallback(error)
        }

        return
      }

      if (self._actCallback) {
        if (self._response.payload.error) {
          let responseError = Errio.fromObject(self._response.payload.error)
          let responseErrorCause = responseError.cause
          let error = new Errors.BusinessError(Constants.BUSINESS_ERROR, {
            pattern: self._cleanPattern
          }).causedBy(responseErrorCause ? responseError.cause : responseError)

          self.log.error(error)

          return self._actCallback(responseError)
        }

        self._actCallback(null, self._response.payload.result)
      }
    }

    /**
     *
     *
     * @param {any} response
     * @returns
     */
    function sendRequestHandler (response) {
      const self = this
      const res = self._decoder.decode.call(ctx, response)
      self._response.payload = res.value
      self._response.error = res.error

      try {
        // if payload is invalid
        if (self._response.error) {
          let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
            pattern: self._cleanPattern
          }).causedBy(self._response.error)

          self.log.error(error)

          if (self._actCallback) {
            return self._actCallback(error)
          }
        }

        self._extensions.onClientPostRequest.invoke(self, onClientPostRequestHandler)
      } catch (err) {
        let error = new Errors.FatalError(Constants.FATAL_ERROR, {
          pattern: self._cleanPattern
        }).causedBy(err)

        self.log.fatal(error)

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
     * @returns
     */
    function onPreRequestHandler (err) {
      const self = this

      let m = self._encoder.encode.call(self, self._message)

      // throw encoding issue
      if (m.error) {
        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(m.error)

        self.log.error(error)

        if (self._actCallback) {
          return self._actCallback(error)
        }

        return
      }

      if (err) {
        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        self.log.error(error)

        if (self._actCallback) {
          return self._actCallback(error)
        }

        return
      }

      self._request.payload = m.value
      self._request.error = m.error

      // use simple publish mechanism instead of request/reply
      if (pattern.pubsub$ === true) {
        if (self._actCallback) {
          self.log.info(Constants.PUB_CALLBACK_REDUNDANT)
        }

        self._transport.send(pattern.topic, self._request.payload)
      } else {
        // send request
        let sid = self._transport.sendRequest(pattern.topic, self._request.payload, sendRequestHandler.bind(self))

        // handle timeout
        self.handleTimeout(sid, pattern)
      }
    }

    // create new execution context
    let ctx = this.createContext()
    ctx._pattern = pattern
    ctx._prevContext = this
    ctx._actCallback = _.isFunction(cb) ? cb.bind(ctx) : null
    ctx._cleanPattern = Util.cleanPattern(pattern)
    ctx._response = new ClientResponse()
    ctx._request = new ClientRequest()

    ctx._extensions.onClientPreRequest.invoke(ctx, onPreRequestHandler)
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
  handleTimeout (sid, pattern) {
    const timeout = pattern.timeout$ || this._config.timeout

    function onClientPostRequestHandler (err) {
      const self = this
      if (err) {
        self._response.error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self.log.error(self._response.error)
      }

      if (self._actCallback) {
        try {
          self._actCallback(self._response.error)
        } catch (err) {
          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern
          }).causedBy(err)

          self.log.fatal(error)

          // let it crash
          if (self._config.crashOnFatal) {
            self.fatal()
          }
        }
      }
    }

    let timeoutHandler = () => {
      let error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR, {
        pattern
      })

      this.log.error(error)

      this._response.error = error

      this._extensions.onClientPostRequest.invoke(this, onClientPostRequestHandler)
    }

    this._transport.timeout(sid, timeout, 1, timeoutHandler)
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
    var self = this

    var ctx = Object.create(self)

    return ctx
  }

  /**
   * Return the list of all registered actions
   *
   * @memberOf Hemera
   */
  list (params) {
    return this._router.list(params)
  }

  /**
   * Close the process watcher and the underlying transort driver.
   *
   * @returns
   *
   * @memberOf Hemera
   */
  close () {
    this._heavy.stop()

    return this._transport.close()
  }
}

module.exports = Hemera
