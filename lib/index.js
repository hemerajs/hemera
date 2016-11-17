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
  Debug = require('debug')('hemera'),
  SafeStringify = require('fast-safe-stringify'),
  Parse = require('fast-json-parse');

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
      this.nats = params.nats;
      this.timeout = params.timeout || 2000;
    }
    /**
     * 
     * 
     * @param {any} cb
     * 
     * @memberOf Hemera
     */
  ready(cb) {

      this.nats.on('connect', () => {
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

      this.nats.on('error', (err) => {
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
      if (self.nats.listenerCount(topic)) {
        return;
      }

      //Add subscriber
      self.nats.subscribe(topic, {
        'queue': 'queue.' + topic
      }, (request, replyTo) => {

        //Parse response as JSON
        let result = Parse(request);

        //@TODO error return to callee
        if (result.error) {
          return Debug(result.error);
        }

        let handler = this.catalog.lookup(result.value.pattern);

        if (handler) {

          handler(result.value.pattern, (resp) => {

            //Parse msg as JSON
            let msg = SafeStringify(resp);

            this.nats.publish(replyTo, msg);
          });
        } else {

          //@TODO return error back to callee
          Debug(`No handler found for signature: %s`, result.pattern);
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
        throw (new Error(NO_TOPIC_TO_SUBSCRIBE));
      }

      let handler = this.catalog.lookup(pattern);

      if (handler) {
        throw (new Error(PATTERN_ALREADY_IN_USE));
      }

      if (typeof cb !== 'function') {
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
        throw (new Error(NO_TOPIC_TO_REQUEST));
      }

      //Parse msg as JSON
      let msg = SafeStringify({
        pattern
      });

      //Request to topic
      let sid = this.nats.request(pattern.topic, msg, (response) => {

        //Parse response as JSON
        let result = Parse(response);

        if (result.error) {

          if (typeof cb === 'function') {
            return cb(result.error);
          }

          Debug(error);
        }

        if (typeof cb === 'function') {
          cb(null, result.value);
        }
      });

      //Handle timeout
      this.nats.timeout(sid, pattern.$timeout || this.timeout, 1, () => {

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

    return this.nats.close();

  }

}

module.exports = Hemera;