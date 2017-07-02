'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats)

hemera.ready(() => {
  const UnauthorizedError = Hemera.createError('Unauthorized')

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    const err = new UnauthorizedError('Unauthorized action')
    cb(err)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 2
  }, function (err, resp) {
    console.log(err instanceof UnauthorizedError)
  })
})
