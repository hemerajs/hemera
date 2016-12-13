'use strict'

const Hemera = require('../../packages/hemera'),
  HemeraParambulator = require('../../packages/hemera-parambulator'),
  Util = require('../../packages/hemera/lib/util'),
  Code = require('code'),
  Sinon = require('sinon'),
  Async = require("async"),
  HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0);

describe('Basic', function () {

  var PORT = 6244
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

  it('Should be able to use parambulator as payload validator', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraParambulator)

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send',
        a: {
          type$: 'number'
        }
      }, (resp, cb) => {

        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        a: '1'
      }, (err, resp) => {

        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('The value "1" is not of type \'number\' (parent: a).')
        hemera.close()
        done()
      })
    })
  })

})
