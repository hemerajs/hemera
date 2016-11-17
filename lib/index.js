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
  Pino = require('pino')(),
  Errio = require('errio'),
  Hoek = require('hoek'),
  SuperError = require('super-error');

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
  ParseError = HemeraError.subclass('HemerParseErroraError'),
  TimeoutError = HemeraError.subclass('TimeoutError'),
  ImplementationError = HemeraError.subclass('ImplementationError'),
  BusinessError = HemeraError.subclass('BusinessError');


//Config
var defaultConfig = {
  timeout: 2000,
  debug: false
};

/**
 * 
 * 
 * @class Hemera
 */
class Hemera {

  constructor(params) {

    this.catalog = Bloomrun();
    this.config = Hoek.applyToDefaults(defaultConfig, params);

  }
  useTransport(transport) {
      this.transport = transport;
    }
    /**
     * 
     * 
     * @readonly
     * 
     * @memberOf Hemera
     */
  get log() {

      return this.config.debug ? Pino : {
        info: () => {},
        error: () => {}
      };
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
      if (self.transport.listenerCount(topic)) {
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

          this.log.error(result.error);

          //Encode msg as JSON
          let msg = SafeStringify({
            result: null,
            error: Errio.stringify(new ParseError(PAYLOAD_PARSING_ERROR))
          });

          return this.transport.publish(replyTo, msg);
        }

        let handler = this.catalog.lookup(result.value.pattern);

        //Check if a handler is registered with this pattern
        if (handler) {

          try {

            handler(result.value.pattern, (err, resp) => {

              if (err && err instanceof Error === false) {
                throw (new HemeraError(INVALID_ERROR_OBJECT))
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

            this.log.error(err);

            //Encode msg as JSON
            let msg = SafeStringify({
              result: null,
              error: Errio.stringify(new ImplementationError(IMPLEMENTATION_ERROR).causedBy(err))
            });

            //Send error back to callee
            this.transport.publish(replyTo, msg, () => {

              //let it crash because its no business error
              process.exit(1);
            });

          }

        } else {

          this.log.info({
            topic
          }, PATTERN_NOT_FOUND);

          //Encode msg as JSON
          let msg = SafeStringify({
            result: null,
            error: Errio.stringify(new HemeraError(PATTERN_NOT_FOUND))
          });

          //Send error back to callee
          this.transport.publish(replyTo, msg);
        }

      });

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

      //Log action
      this.log.info(pattern, `ACT-REQUEST`);
      const t1 = new Date();

      //Request to topic
      let sid = this.transport.request(pattern.topic, msg, (response) => {

        //Measure time
        this.log.info(pattern, `ACT-RESPONSE (${(new Date() - t1)} ms)`);

        //Parse response as JSON
        let msg = Parse(response);

        try {

          if (msg.error) {

            if (typeof cb === 'function') {
              return cb(msg.error);
            }

            this.log.error(error);
          }

          if (typeof cb === 'function') {

            if (msg.value.error) {

              return cb(Errio.parse(msg.value.error));
            }

            cb(null, msg.value.result);
          }

        } catch (err) {

          this.log.error(err);

          //let it crash
          process.exit(1);
        }

      });

      //Handle timeout
      this.transport.timeout(sid, pattern.$timeout || this.config.timeout, 1, () => {

        this.log.error(new TimeoutError(ACT_TIMEOUT_ERROR), 'Pattern: ' + SafeStringify(pattern));

        cb(new TimeoutError(ACT_TIMEOUT_ERROR));
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