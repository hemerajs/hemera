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

  hemera.add({ topic: 'math', cmd: 'sub' }, (resp, cb) => {

    cb(null, resp.a - resp.b)
  })

  /**
  * Call them
  */
  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, function (err, resp) {

    hemera.act({ topic: 'math', cmd: 'add', a: 1, b: resp }, function (err, resp) {

      this.log().info('Result', resp)
    })
  })

  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 20 }, function(err, resp) {
    
    this.log().info('Result', resp)
  })

})