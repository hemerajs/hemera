'use strict'

const Hemera = require('./../')
const nats = require ('nats').connect()

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(() => {

  /**
  * Your Implementations
  */
  hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {

    cb(null, resp.a + resp.b)
  })

})
