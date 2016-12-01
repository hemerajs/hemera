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
  Pino = require('pino'),
  Errio = require('errio'),
  Hoek = require('hoek'),
  _ = require('lodash'),
  Parambulator = require('parambulator'),
  Pretty = Pino.pretty()

const
  Errors = require('./errors'),
  Constants = require('./constants'),
  ActContext = require('./actContext'),
  AddContext = require('./addContext'),
  Util = require('./util')

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

      this.catalog = Bloomrun()
      this.config = Hoek.applyToDefaults(defaultConfig, params || {})
      this.transport = transport
      this.events = new Kilt([this, this.transport])
      this.topics = {}
      this.plugins = {}
        //Special variables for act and add
      this.context$ = {}
      this.meta$ = {}
      this.plugin$ = {}

      //Leads to too much listeners in tests
      if (this.config.logLevel !== 'silent') {
        Pretty.pipe(process.stdout)
      }

      this.logger = Pino({
        name: 'app',
        safe: true,
        level: this.config.logLevel
      }, Pretty)

    }
    /**
     * 
     * 
     * @param {any} plugin
     * 
     * @memberOf Hemera
     */
  use(params) {

      if (this.plugins[params.attributes.name]) {
        let error = new Errors.HemeraError(Constants.PLUGIN_ALREADY_IN_USE)
        this.log().error(error)
        throw (error)
      }

      let ctx = this.createContext()
      ctx.plugin$ = params.attributes
      params.plugin.call(ctx, params.options)

      this.log().info(params.attributes.name, Constants.PLUGIN_ADDED)
      this.plugins[params.attributes.name] = ctx.plugin$

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
     * @readonly
     * 
     * @memberOf Hemera
     */
  log() {

      return this.logger
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

        this.log().info(Constants.TRANSPORT_CONNECTED)
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
  reply(data) {

      if (data instanceof Error) {

        this.log().error(data)

        return Util.stringifyJSON(Hoek.merge({
          result: null,
          error: Errio.stringify(data)
        }, this.delegationData))

      }

      return Util.stringifyJSON(Hoek.merge({
        result: data,
        error: null
      }, this.delegationData))

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
      if (self.topics[topic]) {
        return
      }

      //Queue group names allow load balancing of services
      this.transport.subscribe(topic, {
        'queue': 'queue.' + topic
      }, (request, replyTo) => {

        //Create new execution context
        let ctx = this.createContext()

        AddContext.init(ctx)

        //Parse response as JSON
        let result = Util.parseJSON(request)

        //Invalid payload
        if (result.error) {

          let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR).causedBy(result.error)

          return this.send(replyTo, ctx.reply(error))
        }

        let actMeta = this.catalog.lookup(result.value.pattern)

        //Check if a handler is registered with this pattern
        if (actMeta) {

          result = AddContext.before(ctx, result.value)

          try {

            let paramcheck = Parambulator(actMeta.patternRules)

            //Validate payload
            paramcheck.validate(result, (err) => {

              if (err) {

                let payloadError = new Errors.PayloadValidationError(Constants.PAYLOAD_VALIDATION_ERROR).causedBy(err)

                //Send message
                return this.send(replyTo, ctx.reply(payloadError))
              }

              let action = actMeta.action.bind(ctx)

              //Call action
              action(result, (err, resp) => {

                if (err) {

                  let businessError = new Errors.BusinessError(Constants.IMPLEMENTATION_ERROR).causedBy(err)

                  return this.send(replyTo, ctx.reply(businessError))
                }

                //Send message
                this.send(replyTo, ctx.reply(resp))

              })

            })

          } catch (err) {

            let error = new Errors.ImplementationError(Constants.IMPLEMENTATION_ERROR).causedBy(err)

            //Send error back to callee
            this.send(replyTo, ctx.reply(error), () => {

              //let it crash
              if (this.config.crashOnFatal) {

                this.fatal()
              }
            })

          }

        } else {

          this.log().info({
            topic
          }, Constants.PATTERN_NOT_FOUND)

          let error = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND)

          //Send error back to callee
          this.send(replyTo, ctx.reply(error))
        }

      })

      self.topics[topic] = true

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

        let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_SUBSCRIBE)
        this.log().error(error)
        throw (error)
      }

      if (typeof cb !== 'function') {

        let error = new Errors.HemeraError(Constants.MISSING_IMPLEMENTATION)
        this.log().error(error)
        throw (error)
      }

      let origPattern = _.cloneDeep(pattern)

      let patternRules = {}

      //Remove objects (rules) from pattern
      _.each(pattern, function (v, k) {
        if (_.isObject(v)) {
          patternRules[k] = _.clone(v)
          delete origPattern[k]
        }
      })

      //Create message object which represent the object behind the matched pattern
      let actMeta = {
        patternRules: patternRules,
        pattern: origPattern,
        action: cb
      }

      let handler = this.catalog.lookup(origPattern)

      //Check if pattern is already registered
      if (handler) {

        let error = new Errors.HemeraError(Constants.PATTERN_ALREADY_IN_USE)
        this.log().error(error)
        throw (error)
      }

      //Add to bloomrun
      this.catalog.add(origPattern, actMeta)

      this.log().info(pattern, Constants.ADD_ADDED)

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

        let error = new Errors.HemeraError(Constants.NO_TOPIC_TO_REQUEST)
        this.log().error(error)
        throw (error)
      }

      //Create context
      let ctx = this.createContext()

      ActContext.before(pattern, ctx, this)

      //Clean special $ variables
      let cleanPattern = Util.cleanPattern(pattern)

      //Parse msg as JSON
      let msg = {
        pattern: cleanPattern,
        meta$: ctx.meta$,
        request$: {
          id: ctx.requestId$,
          parentId: ctx.parentId$,
          startTime: Util.nowHrTime()
        }
      }

      this.log().info(pattern, `ACT_OUTBOUND - ID:${msg.request$.id}`)

      //Emit event
      this.emit('outbound', msg)

      //Request to topic
      let sid = this.sendRequest(pattern.topic, Util.stringifyJSON(msg), (response) => {

        //Parse response as JSON
        let msg = Util.parseJSON(response)

        try {

          //If payload is invalid
          if (msg.error) {

            let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR).causedBy(msg.error)
            this.log().error(error)

            if (typeof cb === 'function') {
              return cb(error)
            }
          }

          ActContext.after(ctx, msg.value)

          //Emit event
          this.emit('inbound', msg.value)

          //Log finished request and show id and duration in ms.
          this.log().info(`ACT_INBOUND - ID:${msg.value.request$.id} (${msg.value.request$.duration / 1000000}ms)`)

          if (typeof cb === 'function') {

            if (msg.value.error) {

              let error = new Errors.BusinessError().causedBy(Errio.parse(msg.value.error))
              this.log().error(error)

              //Error is already wrapped
              return cb.call(ctx, Errio.parse(msg.value.error))
            }

            cb.apply(ctx, [null, msg.value.result])
          }

        } catch (err) {

          let error = new Errors.FatalError().causedBy(err)
          this.log().fatal(error)

          //Let it crash
          if (this.config.crashOnFatal) {

            this.fatal()
          }
        }

      })

      //Handle timeout
      this.timeout(sid, pattern.timeout$ || this.config.timeout, 1, () => {

        let error = new Errors.TimeoutError(Constants.ACT_TIMEOUT_ERROR)
        this.log().error(error, pattern)

        if (typeof cb === 'function') {

          try {

            cb(error)
          } catch (err) {

            let error = new Errors.FatalError().causedBy(err)
            this.log().fatal(error)

            //Let it crash
            if (this.config.crashOnFatal) {

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

      return this.catalog.list(params)

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