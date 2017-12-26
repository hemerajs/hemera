'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'error'
})

hemera.use(require('./../../packages/hemera-safe-promises'))

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, cb) {
      cb(null, req.a + req.b)
    }
  )
  hemera
    .act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })
    .then(resp => {
      throw new Error('fatal')
    })
})
