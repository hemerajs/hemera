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
  // Pubsub semantic
  hemera.add(
    {
      topic: 'math'
    },
    function(req) {
      hemera.log.info(req)
    }
  )
  // Publish from Golang client
  nats.publish(
    'math',
    JSON.stringify({
      request: { type: 'pubsub' },
      pattern: { topic: 'math', a: 1, b: 2 }
    })
  )

  // Request semantic
  hemera.add(
    {
      topic: 'math.add'
    },
    function(req) {
      hemera.log.info(req)
      return Promise.resolve(req.a + req.b)
    }
  )
  // Publish from Golang client
  nats.request(
    'math.add',
    JSON.stringify({
      request: { type: 'request' },
      pattern: { topic: 'math.add', a: 1, b: 2 }
    }),
    response => {
      console.log(response)
    }
  )
})
