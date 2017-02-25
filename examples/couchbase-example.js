'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraCouchbaseStore = require('./../packages/hemera-couchbase-store')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

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
