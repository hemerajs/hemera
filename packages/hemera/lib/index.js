// @flow

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

import Errors from './errors'
import Constants from './constants'
import Ext from './ext'
import Util from './util'
import DefaultExtensions from './extensions'
import DefaultEncoder from './encoder'
import DefaultDecoder from './decoder'

var defaultConfig: Config = {
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

  context$: Context;
  meta$: Meta;
  delegate$: Delegate;
  plugin$: Plugin;
  trace$: Trace;
  request$: Request;

  log: any;

  _config: Config;
  _catalog: any;
  _heavy: any;
  _transport: Nats;
  _topics: {
    [id: string]: boolean
  };
  _plugins: {
    [id: string]: Plugin
  };

  _exposition: any;
  _extensions: {
    [id: string]: Ext
  };
  _shouldCrash: boolean;
  _replyTo: string;
  _request: any;
  _response: any;
  _pattern: any;
  _actMeta: any;
  _prevContext: Hemera;
  _cleanPattern: any;
  _message: any;

  _encoder: Encoder;
  _decoder: Decoder;


  /**
   * Creates an instance of Hemera
   *
   * @param {Nats} transport
   * @param {Config} params
   *
   * @memberOf Hemera
   */
  constructor(transport: Nats, params: Config) {

    super()

    this._config = Hoek.applyToDefaults(defaultConfig, params || {})
    this._catalog = Bloomrun()
    this._heavy = new Heavy(this._config.load)
    this._transport = transport
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

    // contains the list of all registered plugins
    // the core is a plugin to
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
      onClientPreRequest: new Ext('onClientPreRequest'),
      onClientPostRequest: new Ext('onClientPostRequest'),
      onServerPreHandler: new Ext('onServerPreHandler'),
      onServerPreRequest: new Ext('onServerPreRequest'),
      onServerPreResponse: new Ext('onServerPreResponse')
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

      let Pretty = Pino.pretty()

      //Leads to too much listeners in tests
      if (this._config.logLevel !== 'silent') {
        Pretty.pipe(process.stdout)
      }

      this.log = Pino({
        name: this._config.name,
        safe: true,
        level: this._config.logLevel
      }, Pino.pretty())
    }
  }

  /**
   * Return all registered plugins
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get plugins(): {
    [id: string]: any
  } {

    return this._plugins
  }

  /**
   * Return the bloomrun instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get catalog(): any {

    return this._catalog
  }

  /**
   * Return the heavy instance
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get load(): any {

    return this._heavy.load
  }

  /**
   * Return the shared object of all exposed data
   *
   * @readonly
   * @type {Exposition}
   * @memberOf Hemera
   */
  get exposition(): any {

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
  expose(key: string, object: mixed) {

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
  get transport(): Nats {

    return this._transport
  }

  /**
   * Return all registered topics
   *
   * @readonly
   *
   * @memberOf Hemera
   */
  get topics(): {
    [id: string]: any
  } {
    return this._topics
  }

  /**
   * Add an extension. Extensions are called in serie and can only pass an error
   * You can work with the current context manipulate something
   *
   * @param {any} type
   * @param {any} handler
   *
   * @memberOf Hemera
   */
  ext(type: string, handler: Function): void {

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
  use(params: PluginDefinition) {

    if (this._plugins[params.attributes.name]) {
      let error = new Errors.HemeraError(Constants.PLUGIN_ALREADY_IN_USE, {
        plugin: params.attributes.name
      })
      this.log.error(error)
      throw (error)
    }

    // create new execution context
    let ctx = this.createContext()
    ctx.plugin$ = {}
    ctx.plugin$.attributes = params.attributes || {}
    ctx.plugin$.attributes.dependencies = params.attributes.dependencies || []
    ctx.plugin$.options = params.options || {}
    ctx.plugin$.options.payloadValidator = params.options.payloadValidator || ''

    params.plugin.call(ctx, params.options)

    this.log.info(params.attributes.name, Constants.PLUGIN_ADDED)
    this._plugins[params.attributes.name] = ctx.plugin$.attributes

  }

  /**
   * Change the current plugin configuration
   * e.g to set the payload validator
   *
   * @param {any} options
   *
   * @memberOf Hemera
   */
  setOption(key: string, value: any) {

    this.plugin$.options[key] = value
  }

  /**
   * Change the base configuration.
   *
   *
   * @memberOf Hemera
   */
  setConfig(key: string, value: any) {

    this._config[key] = value
  }

  /**
   * Exit the process
   *
   * @memberOf Hemera
   */
  fatal() {

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
  ready(cb: Function) {

    this._transport.on('connect', () => {

      this.log.info(Constants.TRANSPORT_CONNECTED)

      if (_.isFunction(cb)) {
        cb.call(this)
      }

    })
  }

  /**
   *
   * @returns
   *
   * @memberOf Hemera
   */
  timeout() {

    return this.transport.timeout.apply(this.transport, arguments)
  }
  /**
   * Publishing with the NATS driver
   *
   * @returns
   *
   * @memberOf Hemera
   */
  send() {

    return this.transport.publish.apply(this.transport, arguments)
  }

  /**
   * Send request with the NATS driver
   *
   * @returns
   *
   * @memberOf Hemera
   */
  sendRequest() {

    return this.transport.request.apply(this.transport, arguments)
  }

  /**
   * Build the final payload for the response
   *
   *
   * @memberOf Hemera
   */
  _buildMessage() {

    let result: Response = this._response

    let message: Message = {
      meta: this.meta$ || {},
      trace: this.trace$ || {},
      request: this.request$,
      result: result instanceof Error ? null : result,
      error: result instanceof Error ? Errio.toObject(result) : null
    }

    let endTime: number = Util.nowHrTime()
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
  finish() {

    let self: Hemera = this;

    self._extensions.onServerPreResponse.invoke(self, function (err) {

      // check if an error was already catched
      if (self._response instanceof Error) {

        self.log.error(self._response)
      }
      // check for an extension error
      else if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self._response = error
        self.log.error(self._response)
      }

      // create message payload
      self._buildMessage()

      // indicates that an error occurs and that the program should exit
      if (self._shouldCrash) {

        // only when we have an inbox othwerwise exit the service immediately
        if (self._replyTo) {

          // send error back to callee
          return self.send(self._replyTo, self._message, () => {

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

        return this.send(this._replyTo, self._message)
      }

    })

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
  subscribe(topic: string, subToMany: boolean, maxMessages: number) {

    let self: Hemera = this

    // avoid duplicate subscribers of the emit stream
    // we use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    let handler = (request: any, replyTo: string) => {

      // create new execution context
      let ctx = this.createContext()
      ctx._shouldCrash = false
      ctx._replyTo = replyTo
      ctx._request = request
      ctx._response = {}
      ctx._pattern = {}
      ctx._actMeta = {}

      self._extensions.onServerPreRequest.invoke(ctx, function (err) {

        let self: Hemera = this

        if (err) {

          let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
          self.log.error(error)
          self._response = error

          return self.finish()
        }

        // find matched RPC
        let requestType = self._request.value.request.type
        self._pattern = self._request.value.pattern
        self._actMeta = self._catalog.lookup(self._pattern)

        // check if a handler is registered with this pattern
        if (self._actMeta) {

          self._extensions.onServerPreHandler.invoke(ctx, function (err: Error) {

            if (err) {

              self._response = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

              self.log.error(self._response)

              return self.finish()
            }

            try {

              let action = self._actMeta.action.bind(self)

              // if request type is 'pubsub' we dont have to reply back
              if (requestType === 'pubsub') {

                action(self._request.value.pattern)

                return self.finish()
              }

              // execute RPC action
              action(self._request.value.pattern, (err: Error, resp) => {

                if (err) {

                  self._response = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR, {
                    pattern: self._pattern
                  }).causedBy(err)

                  return self.finish()
                }

                // assign action result
                self._response = resp

                self.finish()
              })

            } catch (err) {

              self._response = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR, {
                pattern: self._pattern
              }).causedBy(err)

              // service should exit
              self._shouldCrash = true

              self.finish()
            }

          })

        } else {

          self.log.info({
            topic
          }, Constants.PATTERN_NOT_FOUND)

          self._response = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, {
            pattern: self._pattern
          })

          // send error back to callee
          self.finish()
        }

      })

    }

    // standard pubsub with optional max proceed messages
    if (subToMany) {

      self.transport.subscribe(topic, {
        max: maxMessages
      }, handler)
    } else {

      // queue group names allow load balancing of services
      self.transport.subscribe(topic, {
        'queue': 'queue.' + topic,
        max: maxMessages
      }, handler)
    }

    this._topics[topic] = true

  }

  /**
   * The topic is subscribed on NATS and can be called from any client.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add(pattern: {
    [id: string]: any
  }, cb: Function) {

    let hasCallback = _.isFunction(cb)

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {

      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_SUBSCRIBE, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    if (!hasCallback) {

      let error = new Errors.HemeraError(Constants.MISSING_IMPLEMENTATION, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    let origPattern = _.cloneDeep(pattern)

    let schema = {}

    // remove objects (rules) from pattern and extract schema
    _.each(pattern, function (v: string, k: any) {

      if (_.isObject(v)) {
        schema[k] = _.clone(v)
        delete origPattern[k]
      }
    })

    // remove special $ variables from pattern
    origPattern = Util.cleanPattern(origPattern)

    // create message object which represent the object behind the matched pattern
    let actMeta: ActMeta = {
      schema: schema,
      pattern: origPattern,
      action: cb,
      plugin: this.plugin$
    }

    let handler = this._catalog.lookup(origPattern)

    // check if pattern is already registered
    if (handler) {

      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    // add to bloomrun
    this._catalog.add(origPattern, actMeta)

    this.log.info(origPattern, Constants.ADD_ADDED)

    // subscribe on topic
    this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$)
  }

  /**
   * Start an action.
   *
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  act(pattern: {
    [id: string]: number
  }, cb: Function) {

    // topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {

      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_REQUEST, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    // create new execution context
    let ctx = this.createContext()
    ctx._pattern = pattern
    ctx._prevContext = this
    ctx._cleanPattern = Util.cleanPattern(pattern)
    ctx._response = {}
    ctx._request = {}

    ctx._extensions.onClientPreRequest.invoke(ctx, function onPreRequest(err: Error) {

      let self: Hemera = this

      let hasCallback = _.isFunction(cb)

      let m = self._encoder.encode.call(self, self._message)

      // throw encoding issue
      if (m.error) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(m.error)

        self.log.error(error)

        if (hasCallback) {
          return cb.call(self, error)
        }

        return
      }

      if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        self.log.error(error)

        if (hasCallback) {
          return cb.call(self, error)
        }

        return
      }

      ctx._request = m.value

      // use simple publish mechanism instead to fire a request
      if (pattern.pubsub$ === true) {

        if (hasCallback) {
          self.log.info(Constants.PUB_CALLBACK_REDUNDANT)
        }

        self.send(pattern.topic, self._request)
      } else {

        // send request
        let sid = self.sendRequest(pattern.topic, self._request, (response: any) => {

          self._response = self._decoder.decode.call(ctx, response)

          try {

            // if payload is invalid
            if (self._response.error) {

              let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
                pattern: self._cleanPattern
              }).causedBy(self._response.error)

              self.log.error(error)

              if (hasCallback) {
                return cb.call(self, error)
              }
            }

            self._extensions.onClientPostRequest.invoke(ctx, function (err: Error) {

              if (err) {

                let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

                self.log.error(error)

                if (hasCallback) {
                  return cb.call(self, error)
                }

                return
              }

              if (hasCallback) {

                if (self._response.value.error) {

                  let responseError = Errio.fromObject(self._response.value.error)
                  let responseErrorCause = responseError.cause
                  let error = new Errors.BusinessError(Constants.BUSINESS_ERROR, {
                    pattern: self._cleanPattern
                  }).causedBy(responseErrorCause ? responseError.cause : responseError)

                  self.log.error(error)

                  return cb.call(self, responseError)
                }

                cb.apply(self, [null, self._response.value.result])
              }

            })

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
        })

        // handle timeout
        self.handleTimeout(sid, pattern, cb)
      }

    })

  }

  /**
   * Handle the timeout when a pattern could not be resolved. Can have different reasons:
   * - No one was connected at the time (service unavailable)
   * - Service is actually still processing the request (service takes too long)
   * - Service was processing the request but crashed (service error)
   *
   * @param {any} sid
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  handleTimeout(sid: number, pattern: {
    [id: string]: number
  }, cb: Function) {

    // handle timeout
    this.timeout(sid, pattern.timeout$ || this._config.timeout, 1, () => {

      let hasCallback = _.isFunction(cb)

      let error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR, {
        pattern
      })

      this.log.error(error)

      if (hasCallback) {

        try {

          cb.call(this, error)
        } catch (err) {

          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern
          }).causedBy(err)

          this.log.fatal(error)

          // let it crash
          if (this._config.crashOnFatal) {

            this.fatal()
          }
        }
      }
    })
  }

  /**
   * Create new instance of hemera but with pointer on the previous propertys
   * so we are able to create a scope per act without lossing the reference to the core api.
   *
   * @returns
   *
   * @memberOf Hemera
   */
  createContext() {

    var self = this

    var ctx: Hemera = Object.create(self)

    return ctx
  }

  /**
   * Return the list of all registered actions
   *
   * @memberOf Hemera
   */
  list(params: any) {

    return this._catalog.list(params)
  }

  /**
   * Close the process watcher and the underlying transort driver.
   *
   * @returns
   *
   * @memberOf Hemera
   */
  close() {

    this._heavy.stop()

    return this.transport.close()
  }
}

module.exports = Hemera
