'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info',
  prettyLog: false,
  traceLog: true
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'sub'
    },
    function(req, cb) {
      cb(null, req.a - req.b)
    }
  )
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
      b: 20
    },
    function(err, resp) {
      if (err) {
        this.log.error(err)
        return
      }
      this.log.info(resp)
      this.act({
        topic: 'math',
        cmd: 'sub',
        a: 100,
        b: 20
      })
    }
  )
})
