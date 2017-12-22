'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'silent'
})

const results = []

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (resp, reply) => {
      for (let i = 0; i < 1000; i++) {
        reply(null, i)
      }
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      maxMessages$: 1000
    },
    function(err, resp) {
      results.push(resp)
      if (results.length === 1000) {
        console.log('Received 1000 Messages!')
      }
    }
  )
})
