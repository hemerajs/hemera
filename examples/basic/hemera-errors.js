'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({
  preserveBuffers: true
})

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(new Hemera.errors.ResponseError('test'))
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 'ddd'
    },
    function(err, resp) {
      this.log.debug(err instanceof Hemera.errors.ResponseError)
    }
  )
})
