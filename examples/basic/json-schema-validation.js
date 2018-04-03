'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const HemeraAjv = require('./../../packages/hemera-ajv')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraAjv)

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add',
      properties: {
        a: { type: 'number' },
        b: { type: 'number' }
      }
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 'dd',
      b: 2
    },
    function(err, resp) {
      if (err) {
        this.log.error(err)
        return
      }
      this.log.info(resp)
    }
  )
})
