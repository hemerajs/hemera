'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraOpentracing = require('./../../packages/hemera-opentracing')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true,
  tag: 'math'
})

hemera.use(hemeraOpentracing, {
  serviceName: 'math'
})

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
  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    },
    async function(err, resp) {}
  )
})
