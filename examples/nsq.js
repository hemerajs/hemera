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
    topic: 'nsq',
    cmd: 'read',
    subject: 'processPayment',
    channel: 'payment'
  }, function (res, cb) {

    this.log.info(res, 'Data')

    cb()
  })

  hemera.add({
    topic: 'nsq',
    cmd: 'read',
    subject: 'sendNewsletter',
    channel: 'userKlaus'
  }, function (res, cb) {

    this.log.info(res, 'Data')

    cb()
  })

  hemera.add({
    topic: 'nsq',
    cmd: 'read',
    subject: 'sendNewsletter',
    channel: 'userPeter'
  }, function (res, cb) {

    this.log.info(res, 'Data')

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
    subject: 'sendNewsletter',
    channel: 'userPeter',
    data: {
      to: 'peter',
      text: 'Sry but you lose!'
    }
  }, function (err, resp) {

    this.log.info(resp, 'ACK')

  })

  // Send a message to NSQ
  hemera.act({
    topic: 'nsq',
    cmd: 'publish',
    subject: 'sendNewsletter',
    channel: 'userKlaus',
    data: {
      to: 'klaus',
      text: 'You got a gift!'
    }
  }, function (err, resp) {

    this.log.info(resp, 'ACK')

  })

})