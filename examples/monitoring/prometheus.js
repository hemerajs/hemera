'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraPrometheus = require('./../../packages/hemera-prometheus')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true
})

hemera.use(hemeraPrometheus)

hemera.ready(() => {
  const c = new hemera.prom.Counter({
    name: 'test_counter',
    help: 'Example of a counter',
    labelNames: ['code']
  })

  hemera.exposeMetric('test_counter')

  c.inc()

  setInterval(() => c.inc(), 10000)
})
