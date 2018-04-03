'use strict'

const Hemera = require('./../../packages/hemera')
const Nats = require('hemera-testsuite/nats')
const nats = new Nats()
const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(function() {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    req => Promise.resolve(req.a + req.b)
  )
  hemera.act(`topic:math,cmd:add,a:1,b:2`, function(err, resp) {
    if (err) {
      this.log.error(err)
      return
    }
    this.log.info(resp)
  })
})
