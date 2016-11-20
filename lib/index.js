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

      Pretty.pipe(process.stdout)

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
  use(plugin, options) {

      let delegate = this.delegate()
      let pluginConfig = plugin.call(delegate, options)
      delegate.plugin$ = pluginConfig

      if (this.plugins[pluginConfig.name]) {

        this.log().error(new HemeraError(PLUGIN_ALREADY_IN_USE))
        throw (new HemeraError(PLUGIN_ALREADY_IN_USE))
      }

      this.log().info(pluginConfig, PLUGIN_ADDED)
      this.plugins[pluginConfig.name] = pluginConfig

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

        let error = new TransportError(TRANSPORT_CONNECTED);
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

      //Avoid duplicate subsrcibers of the emit stream
      //We use one subscriber per topic
      if (self.topics[topic]) {
        return
      }

      //Add subscriber
      this.transport.subscribe(topic, {
        'queue': 'queue.' + topic
      }, (request, replyTo) => {

        //Parse response as JSON
        let result = this.parseJSON(request)

        //Invalid payload
        if (result.error) {

          this.log().error(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(result.error))

          //Encode msg as JSON
          let msg = this.stringifyJSON({
            result: null,
            error: Errio.stringify(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(result.error))
          })

          return this.transport.publish(replyTo, msg)
        }

        this.log().info(result.value.pattern, 'ADD_IN')

        let handler = this.catalog.lookup(result.value.pattern)

        //Check if a handler is registered with this pattern
        if (handler) {

          try {

            result = Hoek.merge(result.value.pattern, {
              meta$: result.value.meta$
            })

            handler(result, (err, resp) => {

              if (err) {
                this.log().error(new BusinessError().causedBy(err))
              }

              //Encode msg as JSON
              let msg = this.stringifyJSON({
                result: resp,
                error: err ? Errio.stringify(new BusinessError(IMPLEMENTATION_ERROR).causedBy(err)) : null
              })

              //Send message
              this.transport.publish(replyTo, msg)
            })

          } catch (err) {

            this.log().fatal(new FatalError().causedBy(err))

            //Encode msg as JSON
            let msg = this.stringifyJSON({
              result: null,
              error: Errio.stringify(new ImplementationError(IMPLEMENTATION_ERROR).causedBy(err))
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

      if (!pattern.topic) {
        this.log().error(new HemeraError(NO_TOPIC_TO_SUBSCRIBE))
        throw (new HemeraError(NO_TOPIC_TO_SUBSCRIBE))
      }

      let handler = this.catalog.lookup(pattern)

      if (handler) {
        this.log().error(new HemeraError(PATTERN_ALREADY_IN_USE))
        throw (new HemeraError(PATTERN_ALREADY_IN_USE))
      }

      if (typeof cb !== 'function') {
        this.log().error(new HemeraError(MISSING_IMPLEMENTATION))
        throw (new HemeraError(MISSING_IMPLEMENTATION))
      }

      //Add to bloomrun
      this.catalog.add(pattern, (resp, reply) => {

        cb.apply(this.delegate(), [resp, reply]);
      })

      this.log().info(pattern, ADD_ADDED)

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

      if (!pattern.topic) {
        this.log().error(new HemeraError(NO_TOPIC_TO_REQUEST))
        throw (new HemeraError(NO_TOPIC_TO_REQUEST))
      }

      //Create delegate
      let delegate = this.delegate()

      //Set context by pattern or current configuration
      delegate.context$ = pattern.context$ || this.context$

      //Set metadata by pattern or previous delegate
      let metadata = pattern.meta$ || delegate.meta$;

      //Parse msg as JSON
      let msg = this.stringifyJSON({
        pattern: pattern,
        meta$: metadata
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

          if (msg.error) {

            this.log().error(new ParseError().causedBy(msg.error))

            if (typeof cb === 'function') {
              return cb(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(msg.error))
            }
          }

          if (typeof cb === 'function') {

            if (msg.value.error) {

              this.log().error(new BusinessError().causedBy(Errio.parse(msg.value.error)))

              return cb.call(delegate, Errio.parse(msg.value.error))
            }

            cb.apply(delegate, [null, msg.value.result])
          }

        } catch (err) {


          this.log().fatal(new FatalError().causedBy(err))

          //Let it crash
          if (this.config.crashOnFatal) {

            this.fatal()
          } else {

            cb.call(delegate, new FatalError().causedBy(err))
          }
        }

      })

      //Handle timeout
      this.transport.timeout(sid, pattern.timeout$ || this.config.timeout, 1, () => {

        this.log().error(new TimeoutError(ACT_TIMEOUT_ERROR), pattern)

        if (typeof cb === 'function') {
          cb(new TimeoutError(ACT_TIMEOUT_ERROR))
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