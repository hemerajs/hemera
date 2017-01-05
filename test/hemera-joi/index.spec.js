'use strict'

const Hemera = require('../../packages/hemera'),
  HemeraJoi = require('../../packages/hemera-joi'),
  Joi = require('joi'),
  Util = require('../../packages/hemera/build/util'),
  Code = require('code'),
  Sinon = require('sinon'),
  HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0);

describe('Hemera-joi', function () {

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

  it('Should be able to use joi as payload validator', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false,
      logLevel: 'silent'
    })

    hemera.use(HemeraJoi)

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send',
        a: Joi.number().required()
      }, (resp, cb) => {

        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        a: 'dwedwed'
      }, (err, resp) => {

        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('ValidationError')
        expect(err.cause.isJoi).to.be.equals(true)
        expect(err.cause.message).to.be.equals('child "a" fails because ["a" must be a number]')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able modify payload by custom payload validator', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false,
      logLevel: 'silent'
    })

    hemera.use(HemeraJoi)

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send',
        a: Joi.number().required(),
        b: Joi.number().default(100)
      }, (resp, cb) => {

        expect(resp.b).to.be.equals(100)
        cb(null, true)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        a: 33
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)

        hemera.close()
        done()
      })
    })
  })

})
