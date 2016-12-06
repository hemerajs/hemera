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
  Kilt = require('kilt'),
  Bloomrun = require('bloomrun'),
  Nats = require('nats'),
  Errio = require('errio'),
  Hoek = require('hoek'),
  _ = require('lodash')

const
  Errors = require('./errors'),
  Constants = require('./constants'),
  ActContext = require('./actContext'),
  AddContext = require('./addContext'),
  Util = require('./util'),
  DefaultLogger = require('./logger'),
  DefaultPayloadValidator = require('./payloadValidator')

//Config
var defaultConfig = {
  timeout: 2000,
  debug: false,
  crashOnFatal: true,
  logLevel: 'silent'
}

/**
 * 
 * 
 * @class Hemera
 */
class Hemera extends EventEmitter {

  constructor(transport, params) {

      super()

      this._config = Hoek.applyToDefaults(defaultConfig, params || {})
      this._catalog = Bloomrun()
      this._transport = transport
      this._events = new Kilt([this, this.transport])
      this._topics = {}
      this._plugins = {}

      //Special variables for act and add
      this.context$ = {}
      this.meta$ = {}
      this.plugin$ = {}
      this.trace$ = {}
      this.request$ = {}

      this.log = this._config.logger || new DefaultLogger({
        level: this._config.logLevel
      })

      this.payloadValidator = this._config.payloadValidator || DefaultPayloadValidator

    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get plugins() {

      return this._plugins;
    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get catalog() {

      return this._catalog;
    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get transport() {

      return this._transport;
    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get topics() {

      return this._topics;
    }
    /**
     * 
     * 
     * @returns
     * 
     * @memberOf Hemera
     */
  get events() {

      return this._events;
    }
    /**
     * 
     * 
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

      let ctx = this.createContext()
      ctx.plugin$ = params.attributes
      params.plugin.call(ctx, params.options)

      this.log.info(params.attributes.name, Constants.PLUGIN_ADDED)
      this._plugins[params.attributes.name] = ctx.plugin$

    }
    /**
     * 
     * 
     * 
     * @memberOf Hemera
     */
  fatal() {

      process.exit(1)

    }
    /**
     * 
     * 
     * @param {any} cb
     * 
     * @memberOf Hemera
     */
  ready(cb) {

      this.events.on('connect', () => {

        this.log.info(Constants.TRANSPORT_CONNECTED)
        cb.call(this)
      })

    }
    /**
     * 
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
     * @param {any} data
     * @returns
     * 
     * @memberOf Hemera
     */
  reply(result) {

      if (result instanceof Error) {

        this.log.error(result)
      }

      AddContext.OnPreResponse(this, result)

      return Util.stringifyJSON(this.message)

    }
    /**
     * 
     * 
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

        AddContext.start(ctx)

        //Parse response as JSON
        let result = Util.parseJSON(request)

        //Invalid payload
        if (result.error) {

          let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
            topic
          }).causedBy(result.error)

          return this.send(replyTo, ctx.reply(error))
        }

        let pattern = result.value.pattern
        let actMeta = this._catalog.lookup(pattern)

        //Check if a handler is registered with this pattern
        if (actMeta) {

          result = AddContext.onPreRequest(ctx, result.value)

          try {

            //Validate payload
            this.payloadValidator.validate(actMeta.schema, result, (err, value) => {

              if (err) {

                let payloadError = new Errors.PayloadValidationError(Constants.PAYLOAD_VALIDATION_ERROR, {
                  pattern
                }).causedBy(err)

                //Send message
                return this.send(replyTo, ctx.reply(payloadError))
              }

              let action = actMeta.action.bind(ctx)

              //Call action
              action(value, (err, resp) => {

                if (err) {

                  let businessError = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR, {
                    pattern
                  }).causedBy(err)

                  return this.send(replyTo, ctx.reply(businessError))
                }

                //Send message
                this.send(replyTo, ctx.reply(resp))

              })

            })

          } catch (err) {

            let error = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR, {
              pattern
            }).causedBy(err)

            //Send error back to callee
            this.send(replyTo, ctx.reply(error), () => {

              //let it crash
              if (this._config.crashOnFatal) {

                this.fatal()
              }
            })

          }

        } else {

          this.log.info({
            topic
          }, Constants.PATTERN_NOT_FOUND)

          let error = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, {
            pattern
          })

          //Send error back to callee
          this.send(replyTo, ctx.reply(error))
        }

      })

      self._topics[topic] = true

    }
    /**
     * 
     * 
     * @param {any} pattern
     * @param {any} cb
     * 
     * @memberOf Hemera
     */
  add(pattern, cb) {

      let self = this

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
     * 
     * 
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

      //Create context
      let ctx = this.createContext()

      //Clean special $ variables
      let cleanPattern = Util.cleanPattern(pattern)

      ActContext.onPreRequest(pattern, cleanPattern, ctx, this)

      this.log.info(pattern, `ACT_OUTBOUND - ID:${ctx.msg.request$.id}`)

      //Emit event
      this.emit('outbound', ctx.msg)

      //Request to topic
      let sid = this.sendRequest(pattern.topic, Util.stringifyJSON(ctx.msg), (response) => {

        //Parse response as JSON
        let msg = Util.parseJSON(response)

        try {

          //If payload is invalid
          if (msg.error) {

            let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR, {
              pattern: cleanPattern
            }).causedBy(msg.error)
            this.log.error(error)

            if (typeof cb === 'function') {
              return cb(error)
            }
          }

          ActContext.onPreHandler(ctx, msg.value, cleanPattern)

          //Emit event
          this.emit('inbound', msg.value)

          //Log finished request and show id and duration in ms.
          this.log.info(`ACT_INBOUND - ID:${ctx.request$.id} (${ctx.request$.duration / 1000000}ms)`)

          if (typeof cb === 'function') {

            if (msg.value.error) {

              let error = new Errors.BusinessError(Constants.BUSINESS_ERROR, {
                pattern: cleanPattern
              }).causedBy(Errio.parse(msg.value.error))
              this.log.error(error)

              //Error is already wrapped
              return cb.call(ctx, Errio.parse(msg.value.error))
            }

            cb.apply(ctx, [null, msg.value.result])
          }

        } catch (err) {

          let error = new Errors.FatalError(Constants.FATAL_ERROR, {
            pattern: cleanPattern
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

    }
    /**
     * 
     * 
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

            cb(error)
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
     * 
     * 
     * @returns
     * 
     * @memberOf Hemera
     */
  createContext() {

      var self = this

      //Create new instance of hemera but with pointer on the previous propertys
      //So we are able to create a scope per act without lossing the reference to the core api.
      var ctx = Object.create(self)

      //Global
      ctx.context$ = self.context$
      ctx.meta$ = self.meta$
      ctx.plugin$ = self.plugin$

      return ctx
    }
    /**
     * 
     * 
     * 
     * @memberOf Hemera
     */
  list(params) {

      return this._catalog.list(params)

    }
    /**
     * 
     * 
     * @returns
     * 
     * @memberOf Hemera
     */
  close() {

    return this.transport.close()

  }

}

module.exports = Hemera