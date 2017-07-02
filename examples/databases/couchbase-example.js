'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect()
const hemeraCouchbaseStore = require('./../../packages/hemera-couchbase-store')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraCouchbaseStore)

hemera.ready(() => {
  hemera.act({
    topic: 'couchbase-store',
    cmd: 'query',
    query: 'SELECT * FROM default'
  }, function (err, resp) {
    this.log.info(resp, 'Query result')
  })
})
