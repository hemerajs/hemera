/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

/**
 * Module Dependencies
 */

const
  EventEmitter = require('events'),
  Bloomrun = require('bloomrun'),
  Errio = require('errio'),
  Hoek = require('hoek'),
  _ = require('lodash')

const
  Errors = require('./errors'),
  Constants = require('./constants'),
  Ext = require('./ext'),
  Util = require('./util'),
  DefaultLogger = require('./logger')

//Config
var defaultConfig = {
  timeout: 2000,
  debug: false,
  crashOnFatal: true,
  logLevel: 'silent'
}

/**
 * @class Hemera
 */
class Hemera extends EventEmitter {

  constructor(transport, params) {

    super()

    this._config = Hoek.applyToDefaults(defaultConfig, params || {})
    this._catalog = Bloomrun()
    this._transport = transport
    this._topics = {}
    this._plugins = {}

    //Special variables for act and add
    this.context$ = {}
    this.meta$ = {}
    this.plugin$ = {}
    this.trace$ = {}
    this.request$ = {}

    //Define extension points
    this._extensions = {
      onClientPreRequest: new Ext('onClientPreRequest', this),
      onClientPostRequest: new Ext('onClientPostRequest', this),
      onServerPreHandler: new Ext('onServerPreHandler', this),
      onServerPreRequest: new Ext('onServerPreRequest', this),
      onServerPreResponse: new Ext('onServerPreResponse', this)
    }

    /**
     * Client - Extension points
     */
    this._extensions.onClientPreRequest.subscribe(function (next) {

      let pattern = this._pattern
      let prevCtx = this._prevContext
      let cleanPattern = this._cleanPattern
      let ctx = this

      //Shared context
      ctx.context$ = pattern.context$ || prevCtx.context$

      //Set metadata by passed pattern or current message context
      ctx.meta$ = Hoek.merge(pattern.meta$ || {}, ctx.meta$)

      //Tracing
      ctx.trace$ = pattern.trace$ || {}
      ctx.trace$.parentSpanId = prevCtx.trace$.spanId
      ctx.trace$.traceId = prevCtx.trace$.traceId || Util.randomId()
      ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : Util.randomId()
      ctx.trace$.timestamp = Util.nowHrTime()
      ctx.trace$.service = pattern.topic
      ctx.trace$.method = Util.pattern(pattern)

      //Request
      let request = {}
      request.id = pattern.requestId$ || Util.randomId()
      request.parentId = ctx.request$.id
      request.timestamp = Util.nowHrTime()

      //Build msg
      let message = {
        pattern: cleanPattern,
        meta$: ctx.meta$,
        trace$: ctx.trace$,
        request$: request
      }

      ctx._message = message

      ctx.log.info(pattern, `ACT_OUTBOUND - ID:${ctx._message.request$.id}`)

      ctx.emit('onClientPreRequest', ctx)

      next()
    })

    this._extensions.onClientPostRequest.subscribe(function (next) {

      let ctx = this
      let pattern = this._pattern
      let msg = ctx._response.value

      //Pass to act context
      ctx.request$ = msg.request$ || {}
      ctx.request$.service = pattern.topic
      ctx.request$.method = Util.pattern(pattern)
      ctx.trace$ = msg.trace$ || {}
      ctx.meta$ = msg.meta$ || {}

      ctx.log.info(`ACT_INBOUND - ID:${ctx.request$.id} (${ctx.request$.duration / 1000000}ms)`)

      ctx.emit('onClientPostRequest', ctx)

      next()
    })

    /**
     * Server - Extension points
     */
    this._extensions.onServerPreRequest.subscribe(function (next) {

      let msg = this._request.value
      let ctx = this

      if (msg) {

        ctx.meta$ = msg.meta$ || {}
        ctx.trace$ = msg.trace$ || {}
        ctx.request$ = msg.request$ || {}
      }

      ctx.emit('onServerPreRequest', ctx)

      next()
    })

    this._extensions.onServerPreRequest.subscribe(function (next) {

      next()

    })

    this._extensions.onServerPreResponse.subscribe(function (next) {

      let ctx = this
      let result = this._response

      let message = {}
      message.meta$ = ctx.meta$ || {}
      message.trace$ = ctx.trace$ || {}
      message.request$ = ctx.request$
      message.result = result instanceof Error ? null : result
      message.error = result instanceof Error ? Errio.stringify(result) : null

      let endTime = Util.nowHrTime()
      message.request$.duration = endTime - message.request$.timestamp
      message.trace$.duration = endTime - message.request$.timestamp

      ctx._message = message

      ctx.emit('onServerPreResponse', ctx)

      next()

    })

    this.log = this._config.logger || new DefaultLogger({
      level: this._config.logLevel
    })
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get plugins() {

    return this._plugins
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get catalog() {

    return this._catalog
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get transport() {

    return this._transport
  }

  /**
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
     * @param {any} type
     * @param {any} handler
     *
     * @memberOf Hemera
     */
  ext(type, handler) {

    this._extensions[type].subscribe(handler)

  }
    /**
     * @param {any} plugin
     *
     * @memberOf Hemera
     */
  use(params) {

    if (this._plugins[params.attributes.name]) {
      let error = new Errors.HemeraError(Constants.PLUGIN_ALREADY_IN_USE, {
        plugin: params.attributes.name
      })
      this.log.error(error)
      throw (error)
    }

    //Create new execution context
    let ctx = this.createContext()
    ctx.plugin$ = params.attributes
    params.plugin.call(ctx, params.options)

    this.log.info(params.attributes.name, Constants.PLUGIN_ADDED)
    this._plugins[params.attributes.name] = ctx.plugin$

  }

  /**
   * @memberOf Hemera
   */
  fatal() {

    process.exit(1)
  }

  /**
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  ready(cb) {

    this._transport.on('connect', () => {

      this.log.info(Constants.TRANSPORT_CONNECTED)
      cb.call(this)
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
   * Add response
   *
   * @returns
   *
   * @memberOf Hemera
   */
  send() {

    return this.transport.publish.apply(this.transport, arguments)
  }

  /**
   * Act
   *
   * @returns
   *
   * @memberOf Hemera
   */
  sendRequest() {

    return this.transport.request.apply(this.transport, arguments)
  }

  /**
   *
   *
   *
   * @memberOf Hemera
   */
  reply() {

    if (this._response instanceof Error) {

      this.log.error(this._response)
    }

    this._extensions.onServerPreResponse.invoke(this, function (err) {

      if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        this.log.error(error)
        throw (error)
      }

      const msg = Util.stringifyJSON(this._message)

      if (this._shouldCrash) {

        //Send error back to callee
        return this.send(this._replyTo, msg, () => {

          //let it crash
          if (this._config.crashOnFatal) {

            this.fatal()
          }
        })

      }

      return this.send(this._replyTo, msg)

    })

  }

  /**
   * @param {any} topic
   * @returns
   *
   * @memberOf Hemera
   */
  subscribe(topic) {

    var self = this

    //Avoid duplicate subscribers of the emit stream
    //We use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    //Queue group names allow load balancing of services
    this.transport.subscribe(topic, {
      'queue': 'queue.' + topic
    }, (request, replyTo) => {

      //Create new execution context
      let ctx = this.createContext()
      ctx._shouldCrash = false
      ctx._replyTo = replyTo
      ctx._request = Util.parseJSON(request)

      this._extensions.onServerPreRequest.invoke(ctx, function (err) {

        if (err) {

          let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

          this.log.error(error)
          throw (error)
        }

        //Invalid payload
        if (this._request.error) {

          let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
            topic
          }).causedBy(this._request.error)

          return this.reply(replyTo, error)
        }

        this._pattern = this._request.value.pattern
        this._actMeta = this._catalog.lookup(this._pattern)

        //Check if a handler is registered with this pattern
        if (this._actMeta) {

          this._extensions.onServerPreHandler.invoke(ctx, function (err) {

            if (err) {

              this._response = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

              this.log.error(this._response)

              //Send message
              return this.reply()
            }

            try {

              let action = this._actMeta.action.bind(this)

              //Call action
              action(this._request.value.pattern, (err, resp) => {

                if (err) {

                  this._response = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR, {
                    pattern: this._pattern
                  }).causedBy(err)

                  return this.reply()
                }

                this._response = resp

                //Send message
                this.reply()
              })

            } catch (err) {

              this._response = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR, {
                pattern: this._pattern
              }).causedBy(err)

              this._shouldCrash = true

              this.reply()
            }

          })

        } else {

          this.log.info({
            topic
          }, Constants.PATTERN_NOT_FOUND)

          this._response = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, {
            pattern: this._pattern
          })

          //Send error back to callee
          this.reply()
        }

      })

    })

    self._topics[topic] = true

  }

  /**
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add(pattern, cb) {

    //Topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {

      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_SUBSCRIBE, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    if (typeof cb !== 'function') {

      let error = new Errors.HemeraError(Constants.MISSING_IMPLEMENTATION, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    let origPattern = _.cloneDeep(pattern)

    let schema = {}

    //Remove objects (rules) from pattern
    _.each(pattern, function (v, k) {

      if (_.isObject(v)) {
        schema[k] = _.clone(v)
        delete origPattern[k]
      }
    })

    //Create message object which represent the object behind the matched pattern
    let actMeta = {
      schema: schema,
      pattern: origPattern,
      action: cb
    }

    let handler = this._catalog.lookup(origPattern)

    //Check if pattern is already registered
    if (handler) {

      let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    //Add to bloomrun
    this._catalog.add(origPattern, actMeta)

    this.log.info(origPattern, Constants.ADD_ADDED)

    //Subscribe on topic
    this.subscribe(pattern.topic)
  }

  /**
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  act(pattern, cb) {

    //Topic is needed to subscribe on a subject in NATS
    if (!pattern.topic) {

      let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_REQUEST, {
        pattern
      })

      this.log.error(error)
      throw (error)
    }

    //Create new execution context
    let ctx = this.createContext()
    ctx._pattern = pattern
    ctx._prevContext = this
    ctx._cleanPattern = Util.cleanPattern(pattern)

    ctx._extensions.onClientPreRequest.invoke(ctx, function onPreRequest(err) {

      if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        this.log.error(error)
        throw (error)
      }

      this._request = Util.stringifyJSON(this._message)

      let sid = this.sendRequest(pattern.topic, this._request, (response) => {

        this._response = Util.parseJSON(response)

        try {

          //If payload is invalid
          if (this._response.error) {

            let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
              pattern: this._cleanPattern
            }).causedBy(this._response.error)

            this.log.error(error)

            if (typeof cb === 'function') {

              return cb.call(this, error)
            }
          }

          this._extensions.onClientPostRequest.invoke(ctx, function (err) {

            if (err) {

              let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

              this.log.error(error)
              throw (error)
            }

            if (typeof cb === 'function') {

              if (this._response.value.error) {

                let error = new Errors.BusinessError(Constants.BUSINESS_ERROR, {
                  pattern: this._cleanPattern
                }).causedBy(Errio.parse(this._response.value.error))

                this.log.error(error)

                //Error is already wrapped
                return cb.call(this, Errio.parse(this._response.value.error))
              }

              cb.apply(this, [null, this._response.value.result])
            }

          })

        } catch (err) {

          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern: this._cleanPattern
          }).causedBy(err)

          this.log.fatal(error)

          //Let it crash
          if (this._config.crashOnFatal) {

            this.fatal()
          }
        }
      })

      //Handle timeout
      this.handleTimeout(sid, pattern, cb)

    })

  }

  /**
   * @param {any} sid
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  handleTimeout(sid, pattern, cb) {

    //Handle timeout
    this.timeout(sid, pattern.timeout$ || this._config.timeout, 1, () => {

      let error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR, {
        pattern
      })

      this.log.error(error)

      if (typeof cb === 'function') {

        try {

          cb.call(this, error)
        } catch (err) {

          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern
          }).causedBy(err)

          this.log.fatal(error)

          //Let it crash
          if (this._config.crashOnFatal) {

            this.fatal()
          }
        }
      }
    })
  }

  /**
   * @returns
   *
   * @memberOf Hemera
   */
  createContext() {

    var self = this

    //Create new instance of hemera but with pointer on the previous propertys
    //So we are able to create a scope per act without lossing the reference to the core api.
    var ctx = Object.create(self)

    return ctx
  }

  /**
   * @memberOf Hemera
   */
  list(params) {

    return this._catalog.list(params)
  }

  /**
   * @returns
   *
   * @memberOf Hemera
   */
  close() {

    return this.transport.close()
  }
}

module.exports = Hemera
