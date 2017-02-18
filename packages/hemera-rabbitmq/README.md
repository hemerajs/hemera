# Hemera-rabbit package

[![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

**Status**: In development

This is a plugin to use [RabbitMQ](https://www.rabbitmq.com) with Hemera.

RabbitMQ is a messaging broker - an intermediary for messaging. It gives your applications a common platform to send and receive messages, and your messages a safe place to live until received. It is complementary to the primary NATS transport system. 

The client use JSON to transfer data.

### Support:
- PUB/SUB

### Start RabbitMQ instance

I recommend to use the free plan to create a RabbitMQ instance on http://cloudamqp.com

### How does it work with NATS and Hemera
We use a seperate topic for every RabbitMQ Topic because with that you can listen in every hemera service for events. Every message will be delivered to the next subscriber. If you have running two instances of your hemera-amqp service and you use a __fanout__ mechanism you will execute your RPC multiple times. As you can see RabbitMQ give you new possibilities how to distribute your data but without lossing the benefits of nats-hemera with regard to load balancing and service-discovery.

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraRabbitmq = require('hemera-rabbitmq')

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
    topic: 'rabbitmq.publisher.message',
    cmd: 'subscribe'
  }, function (req, cb) {

    this.log.info(req, 'Data')

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
```
