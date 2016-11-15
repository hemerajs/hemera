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


/**
 * Constants
 */

// Errors
var
  PATTERN_NOT_FOUND = 'The pattern could not be found!';




class Hemera {

  constructor(params) {

      this.catalog = Bloomrun();
      this.nats = params.nats;
      this.sources = {};
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

      //Avoid duplicate subbsribers of the emit stream
      if (self.sources[topic]) {
        return self.sources[topic];
      }

      // Wrap this.nats.subscribe
      var subscribe = Rx.Observable.fromCallback(this.nats.subscribe, this.nats, (request, replyTo) => {
        return {
          request,
          replyTo
        };
      });

      let source = Rx.Observable.fromEventPattern(
        function add(h) {

          self.nats.subscribe(topic, h)
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
          let result = JSON.parse(x.request);
          var handler = this.catalog.lookup(result.pattern);

          if (handler) {
            this.nats.publish(x.replyTo, handler(result.pattern));
          } else {
            Debug(`No handler found for signature: %s`, result.pattern);
          }
        },
        (err) => {
          console.log('Error: %s', err);
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

    //Parse msg as JSON
    let msg = JSON.stringify({
      pattern
    });

    //Request to topic
    this.nats.request(pattern.topic, msg, (response) => {
      cb(response);
    });

  }

}

module.exports = Hemera;