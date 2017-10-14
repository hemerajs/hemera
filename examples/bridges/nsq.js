'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect()
const hemeraNsq = require('./../../packages/hemera-nsq')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraNsq, {
  nsq: {
    reader: {
      lookupdHTTPAddresses: '127.0.0.1:4161'
    },
    writer: {
      url: '127.0.0.1',
      port: 4150
    }
  }
})

hemera.ready(() => {
  // create subscriber which listen on NSQ events
  // can be subcribed in any hemera service
  hemera.add(
    {
      topic: 'nsq.newsletter.germany',
      cmd: 'subscribe'
    },
    function(req, cb) {
      this.log.info(req, 'Data')

      cb()
    }
  )

  // create NSQ subscriber
  hemera.act(
    {
      topic: 'nsq',
      cmd: 'subscribe',
      subject: 'newsletter',
      channel: 'germany'
    },
    function(err, resp) {
      this.log.info(resp, 'Subscribed ACK')
    }
  )

  // Send a message to NSQ
  hemera.act(
    {
      topic: 'nsq',
      cmd: 'publish',
      subject: 'newsletter',
      data: {
        to: 'klaus',
        text: 'You got a gift!'
      }
    },
    function(err, resp) {
      this.log.info(resp, 'Publish ACK')
    }
  )
})
