'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

/**
 * This is useful if you want to communicate with hemera from other clients e.g Golang, Python.
 * The Apcera team maintains clients written in Python, Ruby, Node.js, Elixir, Java, NGINX, C, and C#
 * More informations https://github.com/nats-io/node-nats
 */

hemera.ready(() => {
  // Receive in NodeJs client
  hemera.add(
    {
      topic: 'math'
    },
    function(req) {
      hemera.log.info(req)
    }
  )
  // Publish from Golang client
  hemera.transport.publish(
    'math',
    JSON.stringify({
      request: { type: 'pubsub' },
      pattern: { topic: 'math', a: 1, b: 2 }
    })
  )
})
