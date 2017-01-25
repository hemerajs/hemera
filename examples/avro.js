'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect({ preserveBuffers: true })
const HemeraAvro = require('./../packages/hemera-avro')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraAvro)

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {

    cb(null, { a: 1 })
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }, function (err, resp) {

    this.log.info('Result', resp.a)
  })
})
