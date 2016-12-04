'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {

  hemera.on('inbound', function (msg) {
    this.log.info(msg);
  })

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, function (resp, cb) {

    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    }, function (err, resp2) {

      this.act({
        topic: 'math',
        cmd: 'add',
        a: 10,
        b: 2
      }, function (err, resp2) {

        cb(null, resp.a - resp.b)
      });
    });
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

    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 100,
      b: resp
    }, function (err, resp) {

      this.log.info('Finished', resp)
    })
  })

})