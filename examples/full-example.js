'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, (req, cb) => {
    cb(null, req.a - req.b)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 2
  }, function (err, resp) {
    hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: resp
    }, function (err, resp) {
      this.log.info(resp, 'Result')
    })
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }, function (err, resp) {
    this.log.info(resp, 'Result')
  })
})
