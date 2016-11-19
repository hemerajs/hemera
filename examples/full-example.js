'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera({
  debug: true
})

Hemera.transport = nats

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (resp, cb) => {

    console.log('Meta', resp.meta$);

    cb(null, resp.a + resp.b)
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

    //Set context
    this.context$.token = '123';

    //Transfer metadata
    this.meta$.test = 'meta';

    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: resp
    }, function (err, resp) {

      console.log('Context', this.meta$);

      this.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: resp
      }, function (err, resp) {

        console.log('Result', resp)
      })
    })

  })

})