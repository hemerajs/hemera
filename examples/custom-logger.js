'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

class Logger {
  info(msg) {

    console.log(msg);
  }
}

const hemera = new Hemera(nats, {
  logLevel: 'info',
  logger: new Logger
})

hemera.ready(() => {

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 2
  }, function (err, resp) {

    this.log.info('Result', resp)
  })
})
