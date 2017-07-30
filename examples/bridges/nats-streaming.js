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
  /**
   * Create nats-streaming-subscription
   */
  hemera.act({
    topic: 'nats-streaming',
    cmd: 'subscribe',
    subject: 'orderCreated',
    options: {
      setAckWait: 10000,
      setDeliverAllAvailable: true,
      setDurableName: 'orderCreated'
    }
  }, function (err, resp) {
    this.log.info(resp, 'ACK')
  })

  /**
   * Add listener for nats-streaming-events
   */
  hemera.add({
    topic: 'nats-streaming.orderCreated'
  }, function (req, reply) {
    this.log.info(req, 'RECEIVED')
    // ACK Message, if you pass an error the message is redelivered every 10 seconds
    reply(/*new Error('test')*/)
  })

  setTimeout(() => {
    /**
     * Publish an event from hemera
     */
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
