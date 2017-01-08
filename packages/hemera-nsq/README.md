# Hemera-nsq package

This is a plugin to use [NSQ](http://nsq.io/) with Hemera.

NSQ promotes distributed and decentralized topologies without single points of failure, enabling fault tolerance and high availability coupled with a reliable message delivery guarantee. It is complementary to the primary NATS transport system. 

The client use JSON to transfer data.

### Start NSQ with Docker

[Steps](http://nsq.io/deployment/docker.html)

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
    topic: 'nsq',
    cmd: 'subscribe',
    subject: 'click',
    channel: 'metrics'
  }, function (res, cb) {

    this.log.info(res, 'Data')

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
