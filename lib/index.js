/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/* jslint node: true */
'use strict';

/**
 * Module Dependencies
 */

const
  Bloomrun = require('bloomrun'),
  SafeStringify = require('fast-safe-stringify'),
  Parse = require('fast-json-parse'),
  Nats = require('nats'),
  Pino = require('pino'),
  Errio = require('errio'),
  Hoek = require('hoek'),
  SuperError = require('super-error'),
  Pretty = Pino.pretty();

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
  PAYLOAD_PARSING_ERROR = 'Invalid payload';

//Errors

var
  HemeraError = SuperError.subclass('HemeraError'),
  ParseError = HemeraError.subclass('HemeraParseErroraError'),
  TimeoutError = HemeraError.subclass('TimeoutError'),
  ImplementationError = HemeraError.subclass('ImplementationError'),
  BusinessError = HemeraError.subclass('BusinessError'),
  FatalError = HemeraError.subclass('FatalError'),
  PatternNotFound = HemeraError.subclass('PatternNotFound');


//Config
var defaultConfig = {
  timeout: 2000,
  debug: false,
  crashOnFatal: true
};

/**
 * 
 * 
 * @class Hemera
 */
class Hemera {

  constructor(params) {

      this.catalog = Bloomrun();
      this.config = Hoek.applyToDefaults(defaultConfig, params || {});
      this.topics = {};


      if (this.config.debug) {

        Pretty.pipe(process.stdout);

        this.logger = Pino({
          name: 'app',
          safe: true
        }, Pretty);
      }

    }
    /**
     * 
     * 
     * @param {any} transport
     * 
     * @memberOf Hemera
     */
  useTransport(transport) {
      this.transport = transport;
    }
    /**
     * 
     * 
     * 
     * @memberOf Hemera
     */
  fatal() {

      process.exit(1);

    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get log() {

      if (!this.config.debug) {

        return {
          info: () => {},
          error: () => {},
          fatal: () => {},
          warn: () => {},
          trace: () => {}
        };
      }

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

      this.transport.on('connect', () => {
        cb();
      });

    }
    /**
     * 
     * 
     * @param {any} cb
     * 
     * @memberOf Hemera
     */
  error(cb) {

      this.transport.on('error', (err) => {

        this.log.error(err);
        cb(err);
      });

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

      var self = this;

      //Avoid duplicate subsribers of the emit stream
      //We use one subscriber per topic
      if (self.topics[topic]) {
        return;
      }

      //Add subscriber
      self.transport.subscribe(topic, {
        'queue': 'queue.' + topic
      }, (request, replyTo) => {

        //Parse response as JSON
        let result = Parse(request);

        //Invalid payload
        if (result.error) {

          this.log.error(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(result.error));

          //Encode msg as JSON
          let msg = SafeStringify({
            result: null,
            error: Errio.stringify(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(result.error))
          });

          return this.transport.publish(replyTo, msg);
        }

        this.log.info(result.value.pattern, 'ADD_IN');

        let handler = this.catalog.lookup(result.value.pattern);

        //Check if a handler is registered with this pattern
        if (handler) {

          try {

            handler(result.value.pattern, (err, resp) => {

              if (err) {
                this.log.error(new BusinessError().causedBy(err));
              }

              //Encode msg as JSON
              let msg = SafeStringify({
                result: resp,
                error: err ? Errio.stringify(new BusinessError(IMPLEMENTATION_ERROR).causedBy(err)) : null
              });

              //Send message
              this.transport.publish(replyTo, msg);
            });

          } catch (err) {

            this.log.fatal(new FatalError().causedBy(err));

            //Encode msg as JSON
            let msg = SafeStringify({
              result: null,
              error: Errio.stringify(new ImplementationError(IMPLEMENTATION_ERROR).causedBy(err))
            });

            //Send error back to callee
            this.transport.publish(replyTo, msg);

            //let it crash
            if (this.config.crashOnFatal) {
              this.fatal();
            }

          }

        } else {

          this.log.info({
            topic
          }, PATTERN_NOT_FOUND);

          //Encode msg as JSON
          let msg = SafeStringify({
            result: null,
            error: Errio.stringify(new PatternNotFound(PATTERN_NOT_FOUND))
          });

          //Send error back to callee
          this.transport.publish(replyTo, msg);
        }

      });

      self.topics[topic] = true;

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
        this.log.error(new HemeraError(NO_TOPIC_TO_SUBSCRIBE));
        throw (new HemeraError(NO_TOPIC_TO_SUBSCRIBE));
      }

      let handler = this.catalog.lookup(pattern);

      if (handler) {
        this.log.error(new HemeraError(PATTERN_ALREADY_IN_USE));
        throw (new HemeraError(PATTERN_ALREADY_IN_USE));
      }

      if (typeof cb !== 'function') {
        this.log.error(new HemeraError(MISSING_IMPLEMENTATION));
        throw (new HemeraError(MISSING_IMPLEMENTATION));
      }

      //Add to bloomrun
      this.catalog.add(pattern, cb);

      //Subscribe on topic
      this.subscribe(pattern.topic);

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
        this.log.error(new HemeraError(NO_TOPIC_TO_REQUEST));
        throw (new HemeraError(NO_TOPIC_TO_REQUEST));
      }

      //Parse msg as JSON
      let msg = SafeStringify({
        pattern
      });

      this.log.info(pattern, 'ACT');
      let t1 = new Date();

      //Request to topic
      let sid = this.transport.request(pattern.topic, msg, (response) => {

        //Measure time
        this.log.info(Hoek.merge(pattern, {
          $time: new Date() - t1
        }), 'ACT_RESP');

        //Parse response as JSON
        let msg = Parse(response);

        try {

          if (msg.error) {

            if (typeof cb === 'function') {
              return cb(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(msg.error));
            }

            this.log.error(new ParseError(PAYLOAD_PARSING_ERROR).causedBy(msg.error));
          }

          if (typeof cb === 'function') {

            if (msg.value.error) {

              return cb(Errio.parse(msg.value.error));
            }

            cb(null, msg.value.result);
          }

        } catch (err) {


          this.log.fatal(new FatalError().causedBy(err));

          //let it crash
          if (this.config.crashOnFatal) {
            this.fatal();
          } else {
            cb(new FatalError().causedBy(err));
          }
        }

      });

      //Handle timeout
      this.transport.timeout(sid, pattern.$timeout || this.config.timeout, 1, () => {

        this.log.error(new TimeoutError(ACT_TIMEOUT_ERROR), pattern);

        if (typeof cb === 'function') {
          cb(new TimeoutError(ACT_TIMEOUT_ERROR));
        }

      });

    }
    /**
     * 
     * 
     * 
     * @memberOf Hemera
     */
  list(params) {

      return this.catalog.list(params);

    }
    /**
     * 
     * 
     * @returns
     * 
     * @memberOf Hemera
     */
  close() {

    return this.transport.close();

  }

}

module.exports = Hemera;