'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.expose('test', a => console.log(a))
  // plugin namespace
  hemera.exposition.core.test('Hi!')
})
