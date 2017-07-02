'use strict'

const Hemera = require('./../../hemera')
const Nats = require('nats')
const HemeraCouchbaseStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
const Couchbase = require('couchbase').Mock

const expect = Code.expect

describe('Hemera-couchbase-store', function () {
  let PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT

  let server
  let hemera
  let cluster
  let bucket

  before(function (done) {
    cluster = new Couchbase.Cluster()
    bucket = cluster.openBucket()

    HemeraCouchbaseStore.options.couchbase.bucketInstance = bucket

    server = HemeraTestsuite.start_server(PORT, flags, () => {
      const nats = Nats.connect(authUrl)
      hemera = new Hemera(nats)
      hemera.use(HemeraJoi)
      hemera.use(HemeraCouchbaseStore)
      hemera.ready(done)
    })
  })

  after(function (done) {
    hemera.close()
    server.kill()
    done()
  })

  it('Execute a N1ql Query', function (done) {
    hemera.act({
      topic: 'couchbase-store',
      cmd: 'query',
      query: 'SELECT FROM default LIMIT 1'
    }, (err, resp) => {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      done()
    })
  })
})
