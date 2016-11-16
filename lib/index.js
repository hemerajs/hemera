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
  Rx = require('rx'),
  Debug = require('debug')('hemera'),
  SafeStringify = require('fast-safe-stringify'),
  Parse = require('fast-json-parse');

/**
 * Constants
 */

// Errors
var
  JSON_PARSE_ERROR = 'Invalid JSON payload',
  ACT_TIMEOUT_ERROR = 'Timeout';



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
      this.sources = {};
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
     * @param {any} topic
     * @returns
     * 
     * @memberOf Hemera
     */
  subscribe(topic) {

      var self = this;

      //Avoid duplicate subsribers of the emit stream
      if (self.sources[topic]) {
        return self.sources[topic];
      }

      let source = Rx.Observable.fromEventPattern(
        function add(h) {

          self.nats.subscribe(topic, h);

        },
        function remove(h) {},
        function (request, replyTo) {

          return {
            request,
            replyTo
          };
        }
      );

      source.subscribe(
        (x) => {

          //Parse response as JSON
          let result = Parse(x.request);

          if (result.error) {
            throw (result.error);
          }

          let handler = this.catalog.lookup(result.value.pattern);

          if (handler) {

            handler(result.value.pattern, (resp) => {

              //Parse msg as JSON
              let msg = SafeStringify(resp);

              this.nats.publish(x.replyTo, msg);
            });
          } else {

            //@TODO return error back to callee
            Debug(`No handler found for signature: %s`, result.pattern);
          }
        },
        (err) => {

          Debug(`Error: %s`, err);
        });

      this.sources[topic] = source;

      return source;


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

      //Add to bloomrun
      this.catalog.add(pattern, cb);

      //Subscribe on topic
      return this.subscribe(pattern.topic);

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

      //Parse msg as JSON
      let msg = SafeStringify({
        pattern
      });

      //Request to topic
      let sid = this.nats.request(pattern.topic, msg, (response) => {

        //Parse response as JSON
        let result = Parse(response);

        if (result.error) {
          throw (result.error);
        }

        cb(null, result.value);
      });

      //Handle timeout
      this.nats.timeout(sid, pattern.$timeout || this.timeout, 1, () => {

        cb(new Error(ACT_TIMEOUT_ERROR));
      });

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