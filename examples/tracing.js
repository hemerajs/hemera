'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.on('onClientPostRequest', function () {
    console.log(this.trace$)
  })

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 100,
      b: 20
    })

    // Leads to timeout error
    this.act({
      topic: 'test',
      cmd: 'sub',
      a: 100,
      b: 20
    })

    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 100,
      b: 20
    }, function (err, resp) {
      this.act({
        topic: 'math',
        cmd: 'sub',
        a: 100,
        b: 50
      }, function (err, resp) {
        cb(null, resp)
      })
    })
  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, function (req, cb) {
    cb(null, req.a - req.b)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }, function (err, resp) {
    this.log.info(resp, 'Finished')
  })
})
