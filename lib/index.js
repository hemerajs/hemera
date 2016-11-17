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
  Pino = require('pino')();

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
  MISSING_IMPLEMENTATION = 'Missing implementation';

/**
 * 
 * 
 * @class Hemera
 */
class Hemera {

  constructor(params) {

    this.catalog = Bloomrun();
    this.config = params;
    this.timeout = params.timeout || 2000;

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

        //@TODO error return to callee
        if (result.error) {
          return this.log.error(result.error);
        }

        let handler = this.catalog.lookup(result.value.pattern);

        if (handler) {

          try {

            handler(result.value.pattern, (resp) => {

              //Parse msg as JSON
              let msg = SafeStringify(resp);

              this.transport.publish(replyTo, msg);
            });

          } catch (err) {

            this.log.error(err);

            //let it crash
            process.exit(1);

          }

        } else {

          //@TODO return error back to callee
          this.log.info({
            topic
          }, `No handler found for this pattern`);
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
        this.log.error(new Error(NO_TOPIC_TO_SUBSCRIBE));
        throw (new Error(NO_TOPIC_TO_SUBSCRIBE));
      }

      let handler = this.catalog.lookup(pattern);

      if (handler) {
        this.log.error(new Error(PATTERN_ALREADY_IN_USE));
        throw (new Error(PATTERN_ALREADY_IN_USE));
      }

      if (typeof cb !== 'function') {
        this.log.error(new Error(MISSING_IMPLEMENTATION));
        throw (new Error(MISSING_IMPLEMENTATION));
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
        this.log.error(new Error(NO_TOPIC_TO_REQUEST));
        throw (new Error(NO_TOPIC_TO_REQUEST));
      }

      //Parse msg as JSON
      let msg = SafeStringify({
        pattern
      });

      //Request to topic
      let sid = this.transport.request(pattern.topic, msg, (response) => {

        //Parse response as JSON
        let result = Parse(response);

        try {

          if (result.error) {

            if (typeof cb === 'function') {
              return cb(result.error);
            }

            this.log.error(error);
          }

          if (typeof cb === 'function') {
            cb(null, result.value);
          }

        } catch (err) {

          this.log.error(err);

          //let it crash
          process.exit(1);
        }

      });

      //Handle timeout
      this.transport.timeout(sid, pattern.$timeout || this.timeout, 1, () => {

        this.log.error(new Error(ACT_TIMEOUT_ERROR), 'Pattern: ' + SafeStringify(pattern));

        cb(new Error(ACT_TIMEOUT_ERROR));
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