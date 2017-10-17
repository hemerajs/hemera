'use strict'

const Hemera = require('./../../hemera')
const nats = require('nats').connect({ port: 4222 })
const HemeraControlPlane = require('./../../hemera-controlplane')
const HemeraJoi = require('./../../hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.use(HemeraJoi)
hemera.use(HemeraControlPlane, {
  service: 'math'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )
})
