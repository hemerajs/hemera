'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect({
  preserveBuffers: true
})
const HemeraRedisCache = require('./../../packages/hemera-redis-cache')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(HemeraRedisCache)

hemera.ready(() => {
  hemera.act({
    topic: 'redis-cache',
    cmd: 'set',
    key: 'foo',
    value: 'bar'
  }, function (err, resp) {
    this.log.info(resp, 'Result')

    hemera.act({
      topic: 'redis-cache',
      cmd: 'get',
      key: 'foo'
    }, function (err, resp) {
      this.log.info(resp, 'Result')
    })
  })
})
