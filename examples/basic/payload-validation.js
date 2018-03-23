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
      preJoi$: {
        a: Joi.number().required(),
        b: Joi.number().required()
      },
      postJoi$: {
        a: Joi.number().required(),
        b: Joi.number().required()
      }
    },
    (req, cb) => {
      cb(null, {
        a: req.a + req.b,
        b: '33'
      })
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    },
    function(err, resp) {
      this.log.info(err, resp)
    }
  )
})
