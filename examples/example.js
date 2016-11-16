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
  })

  hemera.add({ topic: 'math', cmd: 'sub' }, (resp, cb) => {

    cb(resp.a - resp.b);
  })

  /**
  * Call them
  */
  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  hemera.act({ topic: 'math', cmd: 'sub', a: 1, b: 20 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  hemera.act({ topic: 'math', cmd: 'sub', a: 100, b: 20 }, (err, resp) => {
    
    console.log('Result', resp);
  });

});
