# Hemera-nsq package

[![npm](https://img.shields.io/npm/v/hemera-nsq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nsq)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [NSQ](http://nsq.io/) with Hemera.

NSQ promotes distributed and decentralized topologies without single points of failure, enabling fault tolerance and high availability coupled with a reliable message delivery guarantee. It is complementary to the primary NATS transport system. 

The client use JSON to transfer data.

### Start NSQ with Docker

[Steps](http://nsq.io/deployment/docker.html)

### How does it work with NATS and Hemera
We use a seperate topic for every NSQ Topic/Channels because with that you can listen in every hemera service for events. Every message will be delivered to the next subscriber. If you have running two instances of your hemera-amqp service and you use a __fanout__ mechanism you will execute your RPC multiple times. As you can see NSQ give you new possibilities how to distribute your data but without lossing the benefits of nats-hemera with regard to load balancing and service-discovery.

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraNsq = require('hemera-nsq')

hemeraNsq.options.nsq = {
  reader: {
    lookupdHTTPAddresses: 'http://127.0.0.1:4161'
  },
  writer: {
    url: '127.0.0.1',
    port: 4150
  }
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraNsq)

hemera.ready(() => {

  // Listen to a NSQ events
  // This action can be called multiple times.
  hemera.add({
    topic: 'nsq.click.metrics',
    cmd: 'subscribe'
  }, function (req, cb) {

    this.log.info(req, 'Data')

    cb()
  })

  // Send a message to NSQ
  hemera.act({
    topic: 'nsq',
    cmd: 'publish',
    subject: 'click',
    channel: 'metrics',
    data: {
      a: 'test',
      b: 50
    }
  }, function (err, resp) {

    this.log.info(resp, 'ACK')

  })

})
```
