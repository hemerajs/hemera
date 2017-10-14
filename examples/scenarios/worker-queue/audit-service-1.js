'use strict'

const Hemera = require('./../../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'payment.events',
      cmd: 'created',
      queue$: 'audit'
    },
    function(req) {
      console.log('auditService-1')
    }
  )
})
