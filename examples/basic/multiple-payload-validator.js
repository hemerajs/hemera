'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({
  preserveBuffers: true
})
const HemeraJoi = require('./../../packages/hemera-joi')
const HemeraParambulator = require('./../../packages/hemera-parambulator')

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.use(HemeraJoi)

function myPlugin (options) {
  var hemera = this

  hemera.use(HemeraParambulator)
  hemera.setOption('payloadValidator', 'hemera-parambulator')

  hemera.add({
    topic: 'math',
    cmd: 'sub',
    a: {
      type$: 'number'
    }
  }, (req, cb) => {
    cb(null, req.a - req.b)
  })
}

hemera.use({
  plugin: myPlugin,
  attributes: {
    name: 'myPlugin',
    dependencies: []
  },
  options: {}
})

hemera.ready(() => {
  hemera.setOption('payloadValidator', 'hemera-joi')

  let Joi = hemera.exposition['hemera-joi'].joi

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required()
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 3,
    b: 20
  }, function (err, resp) {
    this.log.info(err, 'Error') // Error: child "a" fails because ["a" must be a number]
  })

  hemera.act({
    topic: 'math',
    cmd: 'sub',
    a: 3,
    b: 5
  }, function (err, resp) {
    this.log.info(err, 'Error') // Error: The value "ddd" is not of type 'number' (parent: a).
  })
})
