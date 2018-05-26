'use strict'

const Hemera = require('./../../packages/hemera')
const HemeraKnabe = require('./../../packages/hemera-knabe')
const Hp = require('./../../packages/hemera-plugin')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})
hemera.use(HemeraKnabe)
hemera.use(
  Hp((hemera, opts, done) => {
    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      req => Promise.resolve(req.a + req.b)
    )
    hemera.add(
      {
        topic: 'math',
        cmd: 'sub'
      },
      req => Promise.resolve(req.a - req.b)
    )
    done()
  })
)

hemera.ready(() => {
  hemera.add(`topic:knabe`, req => hemera.log.info(req, 'Result'))
  hemera.sendKnabeReport()
})
