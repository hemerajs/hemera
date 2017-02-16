'use strict'

const Hemera = require('./../../hemera'),
  HemeraCouchbaseStore = require('./../index'),
  Code = require('code'),
  HemeraTestsuite = require('hemera-testsuite'),
  Couchbase = require('couchbase').Mock

const expect = Code.expect

describe('Hemera-couchbase-store', function () {

  let PORT = 6243
  let noAuthUrl = 'nats://localhost:' + PORT

  let server, hemera, cluster, bucket

  before(function (done) {


    cluster = new Couchbase.Cluster()
    bucket = cluster.openBucket()

    HemeraCouchbaseStore.options.couchbase.bucketInstance = bucket

    server = HemeraTestsuite.start_server(PORT, {}, () => {

      //Connect to gnats
      const nats = require('nats').connect(noAuthUrl)

      //Create hemera instance
      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'info'
      })

      hemera.use(HemeraCouchbaseStore)

      hemera.ready(done);

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
