'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.ext('onServerPreRequest', function(hemera, request, reply, next) {
    console.log('onServerPreRequest')
    next()
  })
  hemera.ext('onServerPreHandler', function(hemera, request, reply, next) {
    console.log('onServerPreHandler')
    next()
  })
  hemera.ext('onServerPreResponse', function(hemera, request, reply, next) {
    console.log('onServerPreResponse')
    next()
  })

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
    }
  )
})
