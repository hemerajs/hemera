'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

let logger = {
  info: function(msg) {
    console.log(msg);
  }
}

const hemera = new Hemera(nats, { logLevel: 'info', logger })

hemera.ready(() => {

  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, function (err, resp) {
    
    this.log.info('Result', resp)
  })

})
