'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats)

const ERROR_CODES = {
  1: 'Invalid foo',
  2: 'Invalid bar',
  3: 'Invalid baz'
};

hemera.ready(() => {
  const UnauthorizedError = Hemera.createError('Unauthorized')
  const ForbiddenError = Hemera.createError('Forbidden', function(code){
    this.code = code;
    this.message = ERROR_CODES[code];
  })

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    const err = new UnauthorizedError('Unauthorized action')
    cb(err)
  })

  hemera.add({
    topic: 'math',
    cmd: 'minus'
  }, function (req, cb) {
    const err = new ForbiddenError(3)
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

  hemera.act({
    topic: 'math',
    cmd: 'minus',
    a: 1,
    b: 2
  }, function (err, resp) {
    console.log(err instanceof ForbiddenError)
  })
})
