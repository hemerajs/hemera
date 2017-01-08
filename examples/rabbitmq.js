'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraRabbitmq = require('./../packages/hemera-rabbitmq')

hemeraRabbitmq.options.rabbitmq = {
  // arguments used to establish a connection to a broker
  connection: {
    uri: '<uri>'
  },

  // define the exchanges
  exchanges: [{
    name: "pubsub",
    type: "fanout"
  }],
  queues: [{
    name: "payment",
    autoDelete: true,
    subscribe: true
  }],
  // binds exchanges and queues to one another
  bindings: [{
    exchange: "pubsub",
    target: "payment",
    keys: []
  }]
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraRabbitmq)

hemera.ready(() => {

  // Listen to a Rabbitmq events
  // This action can be called multiple times.
  hemera.add({
    topic: 'rabbitmq',
    cmd: 'subscribe',
    type: 'publisher.message'
  }, function (res, cb) {

    this.log.info(res, 'Data')

    cb()
  })

  setTimeout(function () {

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

      this.log.info(resp, 'ACK')

    })

  }, 500)

})