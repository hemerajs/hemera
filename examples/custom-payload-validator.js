'use strict'

const Hemera = require('./../')
const Joi = require('joi')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ext('onServerPreHandler', function (next) {

  let schema = this._actMeta.schema
  let pattern = this._request.value.pattern

  Joi.validate(pattern, schema, {
    allowUnknown: true
  }, (err, value) => {

    this._request.value.pattern = value

    next(err)
  })

})

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required()
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 'dwed3',
    b: 20
  }, function (err, resp) {

    this.log.info('Error', err.cause.message) //Error child "a" fails because ["a" must be a number]
  })
})
