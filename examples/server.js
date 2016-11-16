'use strict';

const Hemera = require('./../');
const nats = require ('nats').connect();

const hemera = new Hemera({ nats });

hemera.ready(() => {

  /**
  * Your Implementations
  */
  hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {

    cb(resp.a + resp.b);
  });

});
