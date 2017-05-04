'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'scaleUp',
    service: 'math'
  }, function (err, resp) {
    this.log.info('result', resp || err)
  })
})