'use strict';

const Hemera = require('./lib');
const nats = require ('nats').connect("nats://root:root@localhost:6242");

const hemera = new Hemera({ nats });

/**
 * Your Implementations
 */
hemera.add({ topic: 'math', cmd: 'add' }, (resp) => {

  return resp.a + resp.b;
})

hemera.add({ topic: 'math', cmd: 'sub' }, (resp) => {

  return resp.a - resp.b;
})

/**
 * Call them
 */
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, (resp) => {
  
  console.log('Result', resp);
});

hemera.act({ topic: 'math', cmd: 'sub', a: 1, b: 20 }, (resp) => {
  
  console.log('Result', resp);
});

hemera.act({ topic: 'math', cmd: 'sub', a: 100, b: 20 }, (resp) => {
  
  console.log('Result', resp);
});

