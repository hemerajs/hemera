'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraNsq = require('./../../packages/hemera-nsq')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true
})

hemera.use(hemeraNsq, {
  nsqReader: {
    lookupdHTTPAddresses: '127.0.0.1:4161'
  },
  nsqWriter: {
    url: '127.0.0.1',
    port: 4150
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
      this.log.info(err || resp, 'Subscribed ACK')
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
      this.log.info(err || resp, 'Publish ACK')
    }
  )
})
