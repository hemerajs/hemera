'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraArango = require('./../packages/hemera-arango-store')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraArango, {
  arango: {
    url: 'http://127.0.0.1:8529',
    databaseName: 'test'
  }
})

hemera.ready(() => {
  let aql = hemera.exposition['hemera-arango-store'].aqlTemplate

  hemera.act({
    topic: 'arango-store',
    cmd: 'executeAqlQuery',
    type: 'all',
    query: `
    FOR u IN users
    RETURN u
`
  }, function (err, resp) {
    this.log.info(resp, 'Query result')
  })

  const user = {
    name: 'olaf'
  }

  hemera.act({
    topic: 'arango-store',
    cmd: 'executeAqlQuery',
    type: 'one',
    query: aql`INSERT ${user} INTO users`
  }, function (err, resp) {
    this.log.info(resp, 'Query result')
  })
})
