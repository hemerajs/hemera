'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraRabbitmq = require('./../packages/hemera-rabbitmq')

const options = {
  // arguments used to establish a connection to a broker
  connection: {
    uri: 'amqp://user:bitnami@127.0.0.1:5672/?heartbeat=10'
  },

  // define the exchanges
  exchanges: [{
    name: 'pubsub',
    type: 'fanout'
  }],
  queues: [{
    name: 'payment',
    autoDelete: true,
    subscribe: true
  }],
  // binds exchanges and queues to one another
  bindings: [{
    exchange: 'pubsub',
    target: 'payment',
    keys: []
  }]
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraRabbitmq, {
  rabbitmq: options
})

hemera.ready(() => {
  // Listen to a Rabbitmq events
  // This action can be called multiple times.
  hemera.add({
    topic: 'rabbitmq.publisher.message',
    cmd: 'subscribe'
  }, function (req, cb) {
    this.log.info(req, 'Data')
    cb()
  })

  setTimeout(function () {
    // create subscriber
    hemera.act({
      topic: 'rabbitmq',
      cmd: 'subscribe',
      type: 'publisher.message'
    }, function (err, resp) {
      this.log.info(resp, 'Subscriber ACK')
    })

    // Send a message to Rabbitmq
    hemera.act({
      topic: 'rabbitmq',
      cmd: 'publish',
      exchange: 'pubsub',
      type: 'publisher.message',
      data: {
        name: 'peter',
        amount: 50
      }
    }, function (err, resp) {
      this.log.info(resp, 'Publish ACK')
    })
  }, 500)
})
