'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const HemeraJoi = require('./../../packages/hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'error'
})

hemera.use(HemeraJoi)

hemera.ready(() => {
  hemera.setOption('payloadValidator', 'hemera-joi')

  let Joi = hemera.joi

  hemera.add(
    {
      topic: 'math',
      cmd: 'add',
      a: Joi.number().required(),
      b: Joi.number().required()
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 'a'
    },
    function(err, resp) {
      this.log.error(err)
    }
  )
})
