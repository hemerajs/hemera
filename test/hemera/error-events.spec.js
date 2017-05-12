'use strict'

describe('Response error events', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('server response extension error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.ext('onServerPreResponse', function (resp, req, next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })

  it('server response error result', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(new Error('test'))
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })

  it('client response error result', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.on('clientResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('FatalError')
        expect(err.message).to.be.equals('Fatal error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function () {
        throw new Error('test')
      })
    })
  })

  it('client response error result with a custom super error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.on('clientResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Unauthorized')
        expect(err.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function () {
        throw new UnauthorizedError('test')
      })
    })
  })

  it('client response extension error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('clientResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.ext('onClientPostRequest', function (next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })
})
