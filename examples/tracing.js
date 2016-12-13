'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {

  hemera.on('onClientPostRequest', function (msg) {

    console.log(msg);

  })

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (resp, cb) {

    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 100,
      b: 20
    })

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
  }, function (resp, cb) {

    cb(null, resp.a - resp.b)
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

    this.log.info('Finished', resp)
  })
})
