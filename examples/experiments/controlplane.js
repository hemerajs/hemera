'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'scaleUp',
    service: 'math',
    maxMessages$: 2 // receive further error events when the creation of the worker fails
  }, function (err, resp) {
    this.log.info('result', resp || err)
    hemera.act({
      topic: 'controlplane',
      cmd: 'scaleDown',
      service: 'math',
      maxMessages$: 2 // receive further error events when the creation of the worker fails
    }, function (err, resp) {
      this.log.info('result', resp || err)
    })
  })
})