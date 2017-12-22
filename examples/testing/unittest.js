'use strict'

const Hemera = require('./../../packages/hemera')
const Nats = require('hemera-testsuite/nats')
const nats = new Nats()
const hemera = new Hemera(nats)

hemera.ready(function() {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    req => req.a + req.b
  )
  hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
    console.log(err, resp)
  })
})
