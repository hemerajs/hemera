'use strict'

const Hemera = require('./../../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'payment.events',
    cmd: 'created',
    pubsub$: true
  })
})
