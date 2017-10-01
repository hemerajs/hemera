'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect()
const hemeraElasticsearch = require('./../../packages/hemera-elasticsearch')
const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraElasticsearch, {
  elasticsearch: {
    log: 'trace',
    httpAuth: 'elastic:changeme'
  }
})

hemera.ready(() => {
  hemera.act(
    {
      topic: 'elasticsearch',
      cmd: 'create',
      data: {
        index: 'myindex',
        type: 'mytype',
        id: '3',
        body: {
          title: 'Test 1',
          tags: ['y', 'z'],
          published: true,
          published_at: '2013-01-01',
          counter: 1
        }
      }
    },
    function (err, req) {
      this.log.info(req, 'Data')
    }
  )

  hemera.act(
    {
      topic: 'elasticsearch',
      cmd: 'search',
      data: {
        index: 'myindex',
        q: 'title:test'
      }
    },
    function (err, req) {
      this.log.info(req, 'Data')
    }
  )
})
