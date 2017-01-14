'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraNsq = require('./../packages/hemera-nsq')
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
    topic: 'nsq.processPayment.payment',
    cmd: 'subscribe'
  }, function (req, cb) {

    this.log.info(req, 'Data')

    cb()
  })

  hemera.add({
    topic: 'nsq.newsletter.germany',
    cmd: 'subscribe'
  }, function (req, cb) {

    this.log.info(req, 'Data')

    cb()
  })

  // Send a message to NSQ
  hemera.act({
    topic: 'nsq',
    cmd: 'publish',
    subject: 'processPayment',
    channel: 'payment',
    data: {
      name: 'peter',
      amount: 50
    }
  }, function (err, resp) {

    this.log.info(resp, 'ACK')

  })

  // Send a message to NSQ
  hemera.act({
    topic: 'nsq',
    cmd: 'publish',
    subject: 'newsletter',
    channel: 'germany',
    data: {
      to: 'klaus',
      text: 'You got a gift!'
    }
  }, function (err, resp) {

    this.log.info(resp, 'ACK')

  })

})