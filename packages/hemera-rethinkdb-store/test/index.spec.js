'use strict'

const Hemera = require('./../../hemera')
const HemeraRethinkdbStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Code = require('code')
const Nats = require('nats')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Hemera-rethinkdb-store', function () {
  let PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT

  let server
  let hemera
  let testDatabase = 'test'

  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, () => {
      const nats = Nats.connect(authUrl)
      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'info'
      })
      hemera.use(HemeraJoi)
      hemera.use(HemeraRethinkdbStore, {
        rethinkdb: {
          db: testDatabase
        }
      })
      hemera.ready(function () {
        done()
      })
    })
  })

  after(function () {
    hemera.close()
    server.kill()
  })

  it('Create', function (done) {
    hemera.act({
      topic: 'rethinkdb-store',
      cmd: 'create',
      collection: 'users',
      data: {
        name: 'peter'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      done()
    })
  })

  it('Find', function (done) {
    hemera.act({
      topic: 'rethinkdb-store',
      cmd: 'find',
      collection: 'users',
      query: {}
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.array()

      done()
    })
  })
})
