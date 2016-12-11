'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'error'
})

hemera.ready(() => {

  for (var index = 0; index < 100; index++) {

    let a = Math.random();

    hemera.act({
      topic: 'math',
      cmd: 'add',
      a: a,
      b: 2
    }, function (err, resp) {

      if (a + 2 !== resp) {
        throw new Error();
      }

      this.log.info('Result', resp)
    })
  }
})
