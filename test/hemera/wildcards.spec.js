'use strict'

describe('Topic wildcards', function () {
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

  it('Should be able to use token wildcard in topic declaration', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a.>',
        cmd: 'info'
      }, (req, cb) => {
        expect(req.topic).to.be.equals('systems-europe.a.info.details')
        cb(null, true)
      })
      hemera.act({
        topic: 'systems-europe.a.info.details',
        cmd: 'info'
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)
        hemera.close(done)
      })
    })
  })

  it('Should be able to use full wildcard in topic declaration', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a.*',
        cmd: 'info'
      }, (req, cb) => {
        expect(req.topic).to.be.equals('systems-europe.a.info')
        cb(null, true)
      })
      hemera.act({
        topic: 'systems-europe.a.info',
        cmd: 'info'
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)
        hemera.close(done)
      })
    })
  })

  it('Should call the first server method twice because order is significant', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()
    let callback2 = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a.>',
        cmd: 'info'
      }, (req, cb) => {
        callback()
        cb(null, true)
      })

      hemera.add({
        topic: 'systems-europe.a.*',
        cmd: 'info'
      }, (req, cb) => {
        callback2()
        cb(null, true)
      })

      hemera.act({
        topic: 'systems-europe.a.info',
        cmd: 'info'
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)
        expect(callback2.callCount).to.be.equals(0)
        // NATS has registered two subject wildcards
        // On hemera side the order is significant
        expect(callback.callCount).to.be.equals(2)
        hemera.close(done)
      })
    })
  })

  it('Should be able to use token wildcard in pubsub mode', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a.>',
        cmd: 'info'
      }, (req) => {
        expect(req.topic).to.be.equals('systems-europe.a.info.details')
        hemera.close(done)
      })
      hemera.act({
        topic: 'systems-europe.a.info.details',
        cmd: 'info',
        pubsub$: true
      })
    })
  })

  it('Should be able to use full wildcard in pubsub mode', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a.*',
        cmd: 'info'
      }, (req) => {
        expect(req.topic).to.be.equals('systems-europe.a.info')
        hemera.close(done)
      })
      hemera.act({
        topic: 'systems-europe.a.info',
        cmd: 'info',
        pubsub$: true
      })
    })
  })

  it('Should not convert topic without wildcard tokens', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'systems-europe.a',
        cmd: 'info'
      }, (req, cb) => {
        expect(req.topic).to.be.equals('systems-europe.a')
        cb(null, true)
      })

      const br = hemera.router.lookup({
        topic: 'systems-europe.a',
        cmd: 'info'
      })

      expect(br.actMeta.pattern.topic).to.be.equals('systems-europe.a')
      hemera.close(done)
    })
  })
})
