'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    async function(req) {
      return await Promise.reject(new Error('test'))
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10
    },
    async function(err, result) {
      console.log(err)
      await result
      return 'test'
    }
  )
})
