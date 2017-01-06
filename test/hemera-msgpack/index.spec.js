'use strict'

const Hemera = require('../../packages/hemera'),
  HemeraMsgpack = require('../../packages/hemera-msgpack'),
  Util = require('../../packages/hemera/build/util'),
  Code = require('code'),
  Sinon = require('sinon'),
  HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0);

describe.skip('Hemera-msgpack', function () {

  var PORT = 6243
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('encode and decode', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false,
      logLevel: 'silent'
    })

    hemera.use(HemeraMsgpack)

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {

        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

})
