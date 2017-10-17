'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraJoi = require('./../../packages/hemera-joi')
const hemeraRethinkdb = require('./../../packages/hemera-rethinkdb-store')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraRethinkdb, {
  rethinkdb: {
    db: 'test'
  }
})

hemera.ready(() => {
  hemera.act(
    {
      topic: 'rethinkdb-store',
      cmd: 'create',
      collection: 'users',
      data: {
        name: 'peter'
      }
    },
    function(err, resp) {
      this.log.info(resp, 'User inserted!')
    }
  )

  hemera.act(
    {
      topic: 'rethinkdb-store',
      cmd: 'changes',
      collection: 'users',
      maxMessages$: -1
    },
    function(err, resp) {
      this.log.info(resp, 'Change detected!')
    }
  )

  setTimeout(() => {
    hemera.act(
      {
        topic: 'rethinkdb-store',
        cmd: 'create',
        collection: 'users',
        data: {
          name: 'peter'
        }
      },
      function(err, resp) {
        this.log.info(resp, 'User inserted!')
      }
    )
  }, 2000)
})
