'use strict'

describe('Gracefully shutdown', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to unsubscribe active subscription', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    const callback = Sinon.spy()

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

      nats.on('unsubscribe', (sid, subject) => {
        expect(subject).to.be.equals('math')
        callback()
      })

      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(Object.keys(hemera.topics).length).to.be.equals(0)
        expect(callback.called).to.be.equals(true)
        done()
      })
    })
  })

  it('Should be able to unsubscribe multiple active subscriptions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    const callback = Sinon.spy()

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

      hemera.add({
        topic: 'user',
        cmd: 'add'
      }, function (resp, cb) {
        cb()
      })

      hemera.add({
        topic: 'order',
        cmd: 'add'
      }, function (resp, cb) {
        cb()
      })

      nats.on('unsubscribe', (sid, subject) => {
        callback()
      })

      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(Object.keys(hemera.topics).length).to.be.equals(0)
        expect(callback.callCount).to.be.equals(3)
        done()
      })
    })
  })

  it('Should close the underlying nats connection', function (done) {
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
        expect(nats.closed).to.be.equals(true)
        done()
      })
    })
  })

  it('Should gracefully shutdown even when NATS connection is already closed', function (done) {
    const nats = require('nats').connect(authUrl)

    let callback = Sinon.spy()

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.ready(() => {
      hemera.ext('onClose', function (next) {
        callback()
        next()
      })
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

      nats.close()
      expect(nats.closed).to.be.equals(true)
      hemera.close((err) => {
        expect(err).not.to.be.exists()
        expect(callback.called).to.be.equals(true)
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
