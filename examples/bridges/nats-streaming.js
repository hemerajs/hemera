'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect()
const hemeraNatsStreaming = require('./../../packages/hemera-nats-streaming')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraNatsStreaming, {
  clusterId: 'test-cluster',
  clientId: 'test',
  opts: {} // object with NATS/STAN options
})

hemera.ready(() => {
  hemera.act({
    topic: 'nats-streaming',
    cmd: 'subscribe',
    subject: 'orderCreated',
    options: {
      setAckWait: 60000
    },
    maxMessages$: -1 // to subscribe on further events
  }, function (err, resp) {
    this.log.info(resp, 'RECEIVED')
  })

  setTimeout(() => {
    hemera.act({
      topic: 'nats-streaming',
      cmd: 'publish',
      subject: 'orderCreated',
      data: {
        a: 1
      }
    }, function (err, resp) {
      this.log.info(resp, 'PUBLISHED')
    })
  }, 100)
})
