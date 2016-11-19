'use strict'

const Hemera = require('./../')
const nats = require ('nats').connect()

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(() => {

  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, (err, resp) => {
    
    console.log('Result', resp)
  })

})
