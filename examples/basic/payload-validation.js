'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const HemeraJoi = require('./../../packages/hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})
hemera.use(HemeraJoi)
hemera.ready(() => {
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
      a: 'string',
      b: 2
    },
    function(err, resp) {
      if (err) {
        this.log.error(err, resp)
      }
      this.log.info(resp)
    }
  )
})
