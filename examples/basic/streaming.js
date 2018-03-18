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
    function(resp) {
      for (let i = 0; i < 10; i++) {
        this.reply.next(i)
      }
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      maxMessages$: 10
    },
    function(err, resp) {
      if (err) {
        throw err
      }

      results.push(resp)

      if (results.length === 10) {
        console.log('Received 10 Messages!')
      }
    }
  )
})
