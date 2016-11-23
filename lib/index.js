/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/* jslint node: true */
'use strict'

/**
 * Module Dependencies
 */

const
  EventEmitter = require('events'),
  Kilt = require('kilt'),
  Bloomrun = require('bloomrun'),
  SafeStringify = require('fast-safe-stringify'),
  Parse = require('fast-json-parse'),
  Nats = require('nats'),
  Pino = require('pino'),
  Errio = require('errio'),
  Hoek = require('hoek'),
  _ = require('lodash'),
  Parambulator = require('parambulator'),
  SuperError = require('super-error'),
  Pretty = Pino.pretty()

/**
 * Constants
 */

// Errors
var
  JSON_PARSE_ERROR = 'Invalid JSON payload',
  ACT_TIMEOUT_ERROR = 'Timeout',
  NO_TOPIC_TO_SUBSCRIBE = 'No topic to subscribe',
  NO_TOPIC_TO_REQUEST = 'No topic to request',
  PATTERN_ALREADY_IN_USE = 'Pattern is already in use',
  MISSING_IMPLEMENTATION = 'Missing implementation',
  INVALID_ERROR_OBJECT = 'No native Error object passed',
  PATTERN_NOT_FOUND = 'No handler found for this pattern',
  IMPLEMENTATION_ERROR = 'Bad implementation',
  PAYLOAD_PARSING_ERROR = 'Invalid payload',
  PLUGIN_ALREADY_IN_USE = 'Plugin is already registered',
  TRANSPORT_DISCONNECTED = 'Disconnected!',
  TRANSPORT_CONNECTED = 'Connected!',
  PLUGIN_ADDED = 'PLUGIN added!',
  PAYLOAD_VALIDATION_ERROR = 'Invalid payload',
  ADD_ADDED = 'ADD added';

//Errors

var
  HemeraError = SuperError.subclass('HemeraError'),
  ParseError = HemeraError.subclass('HemeraParseError'),
  TimeoutError = HemeraError.subclass('TimeoutError'),
  ImplementationError = HemeraError.subclass('ImplementationError'),
  BusinessError = HemeraError.subclass('BusinessError'),
  FatalError = HemeraError.subclass('FatalError'),
  PatternNotFound = HemeraError.subclass('PatternNotFound'),
  PayloadValidationError = SuperError.subclass('PayloadValidationError'),
  TransportError = SuperError.subclass('TransportError');


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

      super();

      this.catalog = Bloomrun()
      this.config = Hoek.applyToDefaults(defaultConfig, params || {})
      this.transport = transport;
      this.events = new Kilt([this, this.transport]);
      this.topics = {}
      this.plugins = {}
        //Special variables for act and add
      this.context$ = {}
      this.meta$ = {}
      this.plugin$ = {};

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
        let error = new HemeraError(PLUGIN_ALREADY_IN_USE);
        this.log().error(error)
        throw (error)
      }

      let delegate = this.delegate()
      delegate.plugin$ = params.attributes
      params.plugin.call(delegate, params.options)

      this.log().info(params.attributes, PLUGIN_ADDED)
      this.plugins[params.attributes.name] = delegate.plugin$

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

      return this.logger;
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

        this.log().info(TRANSPORT_CONNECTED)
        cb()
      })

      this.events.on('disconnect', () => {

        let error = new TransportError(TRANSPORT_DISCONNECTED);
        this.log().error(error)
        cb()
      })

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

        //Parse response as JSON
        let result = this.parseJSON(request)

        //Invalid payload
        if (result.error) {

          let error = new ParseError(PAYLOAD_PARSING_ERROR).causedBy(result.error);
          this.log().error(error)

          //Encode msg as JSON
          let msg = this.stringifyJSON({
            result: null,
            error: Errio.stringify(error)
          })

          return this.transport.publish(replyTo, msg)
        }

        this.log().info(result.value.pattern, 'ADD_IN')

        let actMeta = this.catalog.lookup(result.value.pattern)

        //Check if a handler is registered with this pattern
        if (actMeta) {

          try {

            //Pass metadata
            result = Hoek.merge(result.value.pattern, {
              meta$: result.value.meta$
            })

            let paramcheck = Parambulator(actMeta.patternRules);

            //Validate payload
            paramcheck.validate(result, (err) => {

              if (err) {

                let payloadError = new PayloadValidationError(PAYLOAD_VALIDATION_ERROR).causedBy(err);
                this.log().error(payloadError)

                let msg = this.stringifyJSON({
                  result: null,
                  error: Errio.stringify(payloadError)
                })

                //Send message
                return this.transport.publish(replyTo, msg)
              }

              //Execute action
              actMeta.action(result, (err, resp) => {

                let msg = null;

                if (err) {

                  let businessError = new BusinessError(IMPLEMENTATION_ERROR).causedBy(err);
                  this.log().error(businessError)

                  msg = this.stringifyJSON({
                    result: null,
                    error: Errio.stringify(businessError)
                  })

                  return this.transport.publish(replyTo, msg);
                }

                //Encode msg as JSON
                msg = this.stringifyJSON({
                  result: resp,
                  error: null
                })

                //Send message
                this.transport.publish(replyTo, msg)
              })

            })

          } catch (err) {

            let error = new ImplementationError(IMPLEMENTATION_ERROR).causedBy(err)
            this.log().fatal(error)

            //Encode msg as JSON
            let msg = this.stringifyJSON({
              result: null,
              error: Errio.stringify(error)
            })

            //Send error back to callee
            this.transport.publish(replyTo, msg, () => {

              //let it crash
              if (this.config.crashOnFatal) {

                this.fatal()
              }
            })

          }

        } else {

          this.log().info({
            topic
          }, PATTERN_NOT_FOUND)

          //Encode msg as JSON
          let msg = this.stringifyJSON({
            result: null,
            error: Errio.stringify(new PatternNotFound(PATTERN_NOT_FOUND))
          })

          //Send error back to callee
          this.transport.publish(replyTo, msg)
        }

      })

      self.topics[topic] = true

    }
    /**
     * 
     * 
     * @param {any} msg
     * @returns
     * 
     * @memberOf Hemera
     */
  parseJSON(msg) {

      return Parse(msg);
    }
    /**
     * 
     * 
     * @param {any} msg
     * @returns
     * 
     * @memberOf Hemera
     */
  stringifyJSON(msg) {

      return SafeStringify(msg);
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

      //Topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {

        let error = new HemeraError(NO_TOPIC_TO_SUBSCRIBE)
        this.log().error(error)
        throw (error)
      }

      if (typeof cb !== 'function') {

        let error = new HemeraError(MISSING_IMPLEMENTATION);
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
        action: (resp, reply) => {
          cb.apply(this.delegate(), [resp, reply]);
        }
      };

      let handler = this.catalog.lookup(origPattern)

      //Check if pattern is already registered
      if (handler) {

        let error = new HemeraError(PATTERN_ALREADY_IN_USE)
        this.log().error(error)
        throw (error)
      }

      //Add to bloomrun
      this.catalog.add(origPattern, actMeta)

      this.log().info(pattern, ADD_ADDED)

      //Subscribe on topic
      this.subscribe(pattern.topic)

    }
    /**
     * 
     * 
     * 
     * @memberOf Hemera
     */
  cleanPattern(obj) {

      if (obj === null) return obj

      return _.pickBy(obj, function (val, prop) {
        return !_.includes(prop, '$')
      })
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

        let error = new HemeraError(NO_TOPIC_TO_REQUEST);
        this.log().error(error)
        throw (error)
      }

      //Create delegate
      let delegate = this.delegate()

      //Set context by pattern or current configuration
      delegate.context$ = pattern.context$ || this.context$
        //Set metadata by pattern or previous delegate
      delegate.meta$ = pattern.meta$ || delegate.meta$;

      //Parse msg as JSON
      let msg = this.stringifyJSON({
        pattern: this.cleanPattern(pattern), //clean special $ variables
        meta$: delegate.meta$
      })

      this.log().info(pattern, 'ACT')
      let t1 = new Date()

      //Request to topic
      let sid = this.transport.request(pattern.topic, msg, (response) => {

        //Measure time
        this.log().info(Hoek.merge(pattern, {
          time$: new Date() - t1
        }), 'ACT_RESP')

        //Parse response as JSON
        let msg = this.parseJSON(response)

        try {

          //If payload is invalid
          if (msg.error) {

            let error = new ParseError(PAYLOAD_PARSING_ERROR).causedBy(msg.error)
            this.log().error(error)

            if (typeof cb === 'function') {
              return cb(error)
            }
          }

          if (typeof cb === 'function') {

            if (msg.value.error) {

              let error = new BusinessError().causedBy(Errio.parse(msg.value.error))
              this.log().error(error)

              //error is already wrapped
              return cb.call(delegate, Errio.parse(msg.value.error))
            }

            cb.apply(delegate, [null, msg.value.result])
          }

        } catch (err) {

          let error = new FatalError().causedBy(err);
          this.log().fatal(error)

          //Let it crash
          if (this.config.crashOnFatal) {

            this.fatal()
          } else {

            cb.call(delegate, error)
          }
        }

      })

      //Handle timeout
      this.transport.timeout(sid, pattern.timeout$ || this.config.timeout, 1, () => {

        let error = new TimeoutError(ACT_TIMEOUT_ERROR)
        this.log().error(error, pattern)

        if (typeof cb === 'function') {
          cb(error)
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
  delegate() {

      var self = this

      //Create new instance of hemera but with pointer on the previous propertys
      //So we are able to create a scope per act without lossing the reference to the core api.
      var delegate = Object.create(self)
      delegate.context$ = self.context$
      delegate.meta$ = self.meta$
      delegate.plugin$ = self.plugin$

      return delegate
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