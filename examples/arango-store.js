'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const hemeraArango = require('./../packages/hemera-arango-store')
hemeraArango.options.arango = {
  url: 'http://192.168.99.100:8529',
  databaseName: 'test'
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraArango)

hemera.ready(() => {

  let aql = hemera.exposition.aqlTemplate

  hemera.act({
    topic: 'arango-store',
    cmd: 'aql',
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
    cmd: 'aql',
    type: 'one',
    query: aql`INSERT ${user} INTO users`
  }, function (err, resp) {

    this.log.info(resp, 'Query result')
  })

})