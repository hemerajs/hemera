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

    let r1 = this.requestId$
    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    }, function (err, resp2) {

      let r2 = this.requestId$
      this.log.info('ParentId Level1 Match =', this.parentId$ === r1, this.request$);

      this.act({
        topic: 'math',
        cmd: 'add',
        a: 10,
        b: 2
      }, function (err, resp2) {

        this.log.info('ParentId Level2 Match =', this.parentId$ === r2, this.request$);
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
    b: 2
  }, function (err, resp) {
    let r1 = this.requestId$

    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 1,
      b: resp
    }, function (err, resp) {

      this.log.info('ParentId Match =', r1 === this.parentId$)
    })
  })

})