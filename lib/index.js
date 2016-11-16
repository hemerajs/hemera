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

const Bloomrun = require('bloomrun');
const Rx = require('rx');
const Debug = require('debug')('hemera');
const SafeStringify = require('fast-safe-stringify')
const Parse = require('fast-json-parse')

/**
 * Constants
 */

// Errors
var
  PATTERN_NOT_FOUND = 'The pattern could not be found!',
  JSON_PARSE_ERROR = 'Invalid JSON payload';




class Hemera {

  constructor(params) {

      this.catalog = Bloomrun();
      this.nats = params.nats;
      this.sources = {};
      this.subscribers = [];
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

          self.subscribers.push(self.nats.subscribe(topic, h));
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

              this.nats.publish(x.replyTo, resp);
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
    this.nats.request(pattern.topic, msg, (response) => {
      cb(response);
    });

  }
  /**
   * 
   * 
   * @returns
   * 
   * @memberOf Hemera
   */
  teardown() {

    return this.subscribers.forEach((sid) => this.nats.unsubscribe(sid));

  }

}

module.exports = Hemera;