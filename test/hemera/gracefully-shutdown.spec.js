'use strict'

describe('Gracefully shutdown', function () {
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

  it('Should be able to unsubscribe all active subscriptions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        cb()
      })

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb()
      })

      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(Object.keys(hemera.topics).length).to.be.equals(0)
        done()
      })
    })
  })

  it('Should close the underlying nats connection', function (done) {
    const nats = require('nats').connect(authUrl)

    let callback = Sinon.spy()
    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        cb()
      })

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        callback()
        cb()
      })

      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(nats.closed).to.be.equals(true)
        done()
      })
    })
  })

  it('Should call close callback even when we did no IO', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'debug'
    })

    hemera.ready(() => {
      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(nats.closed).to.be.equals(true)
        done()
      })
    })
  })

  it('Should be able to listen on error events before exit', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.on('error', (err) => {
        expect(err.message).to.be.equals('test')
        callback()
      })
      hemera.ext('onClose', function (next) {
        next(new Error('test'))
      })
      hemera.close((err) => {
        expect(err).to.be.exists()
        expect(nats.closed).to.be.equals(true)
        expect(callback.called).to.be.equals(true)
        done()
      })
    })
  })
})
