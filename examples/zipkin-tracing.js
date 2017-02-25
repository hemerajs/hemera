'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraZipkin = require('./../packages/hemera-zipkin')
hemeraZipkin.options.host = '192.168.99.100'

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraZipkin)

hemera.ready(() => {
  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'auth',
    cmd: 'signup'
  }, function (req, cb) {
    let userId = 1

    // visible in zipkin ui
    this.delegate$.query = 'SELECT FROM User;'

    this.act({
      topic: 'email',
      cmd: 'send',
      email: req.email,
      message: 'Welcome!',
      delegate$: { info: 'bar' } // visible in zipkin ui
    }, function (err, resp) {
      this.act({
        topic: 'payment',
        cmd: 'process',
        userId: userId
      }, function (err, resp) {
        cb(null, true)
      })
    })
  })

  hemera.add({
    topic: 'payment',
    cmd: 'process'
  }, function (req, cb) {
    cb(null, true)
  })

  hemera.add({
    topic: 'email',
    cmd: 'send'
  }, function (req, cb) {
    cb(null, true)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'auth',
    cmd: 'signup',
    email: 'peter@gmail.com',
    password: '1234',
    delegate$: { foo: 'bar' } // visible in zipkin ui
  }, function (err, resp) {
    this.log.info(resp, 'Finished')
  })
})
