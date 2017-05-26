'use strict'

const Hemera = require('./../packages/hemera')
const HemeraJoi = require('./../packages/hemera-joi')
const HemeraStats = require('./../packages/hemera-stats')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  load: {
    process: {
      sampleInterval: 100
    }
  }
})

hemera.use(HemeraStats)
hemera.use(HemeraJoi)

hemera.ready(() => {
  let Joi = hemera.exposition['hemera-joi'].joi

  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required().default(33)
    .description('this key will match anything you give it')
    .notes(['this is special', 'this is important'])
    .example(1)
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  hemera.act({
    topic: 'stats',
    cmd: 'processInfo'
  }, function (err, resp) {
    console.log(err, resp)
  })
  hemera.act({
    topic: 'stats',
    cmd: 'registeredActions'
  }, function (err, resp) {
    console.log(err, resp)
  })
})
