// @flow

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
var defaultConfig: Config = {
  timeout: 2000,
  debug: false,
  crashOnFatal: true,
  logLevel: 'silent'
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
  _transport: Nats;
  _topics: { [id: string]: boolean };
  _plugins: { [id: string]: Plugin };

  _extensions: { [id: string]: Ext };
  _shouldCrash: boolean;
  _replyTo: string;
  _request: any;
  _response: any;
  _pattern: any;
  _actMeta: any;
  _prevContext: Hemera;
  _cleanPattern: any;
  _message: any;

  constructor(transport: Nats, params: Config) {

    super()

    this._config = Hoek.applyToDefaults(defaultConfig, params || {})
    this._catalog = Bloomrun()
    this._transport = transport
    this._topics = {}
    this._plugins = {}

    //Special variables for act and add
    this.context$ = {}
    this.meta$ = {}
    this.delegate$ = {}
    this.plugin$ = {}
    this.trace$ = {}
    this.request$ = {
      duration: 0,
      parentId: '',
      timestamp: 0,
      id: ''
    }

    //Define extension points
    this._extensions = {
      onClientPreRequest: new Ext('onClientPreRequest'),
      onClientPostRequest: new Ext('onClientPostRequest'),
      onServerPreHandler: new Ext('onServerPreHandler'),
      onServerPreRequest: new Ext('onServerPreRequest'),
      onServerPreResponse: new Ext('onServerPreResponse')
    }

    /**
     * Client - Extension points
     */
    this._extensions.onClientPreRequest.subscribe(function (next: Function) {

      let pattern: Pattern = this._pattern

      let prevCtx = this._prevContext
      let cleanPattern = this._cleanPattern
      let ctx: Hemera = this

      //Shared context
      ctx.context$ = pattern.context$ || prevCtx.context$

      //Set metadata by passed pattern or current message context
      ctx.meta$ = Hoek.merge(pattern.meta$ || {}, ctx.meta$)
      //Is only passed by msg
      ctx.delegate$ = pattern.delegate$ || {}

      //Tracing
      ctx.trace$ = pattern.trace$ || {}
      ctx.trace$.parentSpanId = prevCtx.trace$.spanId
      ctx.trace$.traceId = prevCtx.trace$.traceId || Util.randomId()
      ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : Util.randomId()
      ctx.trace$.timestamp = Util.nowHrTime()
      ctx.trace$.service = pattern.topic
      ctx.trace$.method = Util.pattern(pattern)

      //Request
      let request: Request = {
        id: pattern.requestId$ || Util.randomId(),
        parentId: ctx.request$.id,
        timestamp: Util.nowHrTime(),
        duration: 0
      }

      //Build msg
      let message: ActMessage = {
        pattern: cleanPattern,
        meta$: ctx.meta$,
        delegate$: ctx.delegate$,
        trace$: ctx.trace$,
        request$: request
      }

      ctx._message = message

      ctx.log.info(pattern, `ACT_OUTBOUND - ID:${String(ctx._message.request$.id)}`)

      ctx.emit('onClientPreRequest', ctx)

      next()
    })

    this._extensions.onClientPostRequest.subscribe(function (next: Function) {

      let ctx: Hemera = this
      let pattern: Pattern = this._pattern
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
    this._extensions.onServerPreRequest.subscribe(function (next: Function) {

      let msg = this._request.value
      let ctx: Hemera = this

      if (msg) {

        ctx.meta$ = msg.meta$ || {}
        ctx.trace$ = msg.trace$ || {}
        ctx.delegate$ = msg.delegate$ || {}
        ctx.request$ = msg.request$ || {}
      }

      ctx.emit('onServerPreRequest', ctx)

      next()
    })

    this._extensions.onServerPreRequest.subscribe(function (next: Function) {

      let ctx: Hemera = this

      ctx.emit('onServerPreRequest', ctx)

      next()

    })

    this._extensions.onServerPreResponse.subscribe(function (next: Function) {

      let ctx: Hemera = this

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
  get plugins(): { [id: string]: any } {

    return this._plugins
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get catalog(): any {

    return this._catalog
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get transport(): Nats {

    return this._transport
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */
  get topics(): { [id: string]: any } {
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
  ext(type: string, handler: Function): void {

    this._extensions[type].subscribe(handler)

  }
    /**
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
  ready(cb: Function) {

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
  _buildMessage() {

    let result: Response = this._response

    let message: Message = {
      meta$: this.meta$ || {},
      trace$: this.trace$ || {},
      request$: this.request$,
      result: result instanceof Error ? null : result,
      error: result instanceof Error ? Errio.stringify(result) : null
    }

    let endTime: number = Util.nowHrTime()
    message.request$.duration = endTime - message.request$.timestamp
    message.trace$.duration = endTime - message.request$.timestamp

    this._message = message

  }
  /**
   *
   *
   *
   * @memberOf Hemera
   */
  reply() {

    let self: Hemera = this;

    self._extensions.onServerPreResponse.invoke(self, function (err) {

      //check if an error was already catched
      if (self._response instanceof Error) {

        self.log.error(self._response)
        self._buildMessage()
      }
      //Check for an extension error
      else if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
        self._response = error
        self.log.error(self._response)
        self._buildMessage()
      } else {

        self._buildMessage()
      }

      const msg = Util.stringifyJSON(self._message)

      if (self._shouldCrash) {

        //Send error back to callee
        return self.send(self._replyTo, msg, () => {

          //let it crash
          if (self._config.crashOnFatal) {

            self.fatal()
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
  subscribe(topic: string) {

    let self: Hemera = this

    //Avoid duplicate subscribers of the emit stream
    //We use one subscriber per topic
    if (self._topics[topic]) {
      return
    }

    //Queue group names allow load balancing of services
    self.transport.subscribe(topic, {
      'queue': 'queue.' + topic
    }, (request: any, replyTo: string) => {

      //Create new execution context
      let ctx = this.createContext()
      ctx._shouldCrash = false
      ctx._replyTo = replyTo
      ctx._request = Util.parseJSON(request)
      ctx._pattern = {}
      ctx._actMeta = {}

      //Extension point 'onServerPreRequest'
      self._extensions.onServerPreRequest.invoke(ctx, function (err) {

        let self: Hemera = this

        if (err) {

          let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

          self.log.error(error)
          self._response = error

          //Send message
          return self.reply()
        }

        //Invalid payload
        if (self._request.error) {

          let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
            topic
          }).causedBy(self._request.error)

          return self.reply(replyTo, error)
        }

        self._pattern = self._request.value.pattern
        self._actMeta = self._catalog.lookup(self._pattern)

        //Check if a handler is registered with this pattern
        if (self._actMeta) {

          //Extension point 'onServerPreHandler'
          self._extensions.onServerPreHandler.invoke(ctx, function (err: Error) {

            if (err) {

              self._response = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

              self.log.error(self._response)

              //Send message
              return self.reply()
            }

            try {

              let action = self._actMeta.action.bind(self)

              //Call action
              action(self._request.value.pattern, (err: Error, resp) => {

                if (err) {

                  self._response = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR, {
                    pattern: self._pattern
                  }).causedBy(err)

                  return self.reply()
                }

                self._response = resp

                //Send message
                self.reply()
              })

            } catch (err) {

              self._response = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR, {
                pattern: self._pattern
              }).causedBy(err)

              self._shouldCrash = true

              self.reply()
            }

          })

        } else {

          self.log.info({
            topic
          }, Constants.PATTERN_NOT_FOUND)

          self._response = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, {
            pattern: self._pattern
          })

          //Send error back to callee
          self.reply()
        }

      })

    })

    this._topics[topic] = true

  }

  /**
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  add(pattern: {
    [id: string]: any
  }, cb: Function) {

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
    _.each(pattern, function (v: string, k: any) {

      if (_.isObject(v)) {
        schema[k] = _.clone(v)
        delete origPattern[k]
      }
    })

    //Create message object which represent the object behind the matched pattern
    let actMeta: ActMeta = {
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
  act(pattern: {
    [id: string]: number
  }, cb: Function) {

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
    ctx._response = {}
    ctx._request = {}

    ctx._extensions.onClientPreRequest.invoke(ctx, function onPreRequest(err: Error) {

      let self: Hemera = this

      if (err) {

        let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

        self.log.error(error)

        if (typeof cb === 'function') {
          return cb.call(self, error)
        }

        return
      }

      //Encode msg to JSON
      self._request = Util.stringifyJSON(self._message)

      //Send request
      let sid = self.sendRequest(pattern.topic, self._request, (response: any) => {

        self._response = Util.parseJSON(response)

        try {

          //If payload is invalid
          if (self._response.error) {

            let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
              pattern: self._cleanPattern
            }).causedBy(self._response.error)

            self.log.error(error)

            if (typeof cb === 'function') {
              return cb.call(self, error)
            }
          }

          //Extension point 'onClientPostRequest'
          self._extensions.onClientPostRequest.invoke(ctx, function (err: Error) {

            if (err) {

              let error = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)

              self.log.error(error)

              if (typeof cb === 'function') {
                return cb.call(self, error)
              }

              return
            }

            if (typeof cb === 'function') {

              if (self._response.value.error) {

                let error = new Errors.BusinessError(Constants.BUSINESS_ERROR, {
                  pattern: self._cleanPattern
                }).causedBy(Errio.parse(self._response.value.error))

                self.log.error(error)

                //Error is already wrapped
                return cb.call(self, Errio.parse(self._response.value.error))
              }

              cb.apply(self, [null, self._response.value.result])
            }

          })

        } catch (err) {

          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern: self._cleanPattern
          }).causedBy(err)

          self.log.fatal(error)

          //Let it crash
          if (self._config.crashOnFatal) {

            self.fatal()
          }
        }
      })

      //Handle timeout
      self.handleTimeout(sid, pattern, cb)

    })

  }

  /**
   * @param {any} sid
   * @param {any} pattern
   * @param {any} cb
   *
   * @memberOf Hemera
   */
  handleTimeout(sid: number, pattern: {
    [id: string]: number
  }, cb: Function) {

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
   * OLOO (objects-linked-to-other-objects) is a code style which creates and relates objects directly without the abstraction of classes. OLOO quite naturally * implements [[Prototype]]-based behavior delegation.
   * More details: {@link https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch6.md}
   * @memberOf Hemera
   */
  createContext() {

    var self = this

    //Create new instance of hemera but with pointer on the previous propertys
    //So we are able to create a scope per act without lossing the reference to the core api.
    var ctx: Hemera = Object.create(self)

    return ctx
  }

  /**
   * @memberOf Hemera
   */
  list(params: any) {

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
