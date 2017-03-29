'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.decorate('test', (a) => console.log(a))
  // global namespace
  hemera.test('Hi!')
})
