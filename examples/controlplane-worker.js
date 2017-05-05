'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const HemeraControlPlane = require('./../packages/hemera-controlplane')
const HemeraJoi = require('./../packages/hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(HemeraControlPlane, {
  service: 'math'
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
})
