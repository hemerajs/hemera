'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

class Logger {
  info(msg) {
    console.log(msg)
  }
  debug(msg) {
    console.log(msg)
  }
  error(msg) {
    console.error(msg)
  }
  warn(msg) {
    console.warn(msg)
  }
  fatal(msg) {
    console.error(msg)
  }
  trace(msg) {
    console.log(msg)
  }
}

const hemera = new Hemera(nats, {
  logLevel: 'info',
  logger: new Logger()
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
    function(err, resp) {
      if (err) {
        this.log.info(err)
        return
      }
      this.log.info(resp)
    }
  )
})
