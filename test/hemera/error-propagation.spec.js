'use strict'

describe('Error propagation', function () {
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

  it('Error propagation depth 1', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        cb(new Error('B Error'))
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        expect(err.rootCause.name).to.be.equals('Error')
        expect(err.rootCause.message).to.be.equals('B Error')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')

        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('B Error')

        hemera.close()
        done()
      })
    })
  })

  it('Error propagation depth 1 with super errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        const a = new UnauthorizedError('test')
        a.test = 444
        cb(a)
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        expect(err.rootCause).to.be.not.exists()
        expect(err.cause).to.be.not.exists()

        expect(err.name).to.be.equals('Unauthorized')
        expect(err.message).to.be.equals('test')

        hemera.close()
        done()
      })
    })
  })

  it('Error propagation', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'silent' })

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err.rootCause, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        cb(new Error('B Error'))
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err.rootCause, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        expect(err.cause).to.be.exists()

        expect(err.rootCause.name).to.be.equals('Error')
        expect(err.rootCause.message).to.be.equals('B Error')
        expect(err.rootCause.hops[0].method).to.be.equals('cmd:b,topic:b')
        expect(err.rootCause.hops[0].service).to.be.equals('b')
        expect(err.rootCause.hops[0].app).to.be.exists()
        expect(err.rootCause.hops[0].ts).to.be.exists()

        expect(err.rootCause.hops[1].method).to.be.equals('cmd:c,topic:c')
        expect(err.rootCause.hops[1].service).to.be.equals('c')
        expect(err.rootCause.hops[1].app).to.be.exists()
        expect(err.rootCause.hops[1].ts).to.be.exists()

        expect(err.rootCause.hops[2].method).to.be.equals('cmd:a,topic:a')
        expect(err.rootCause.hops[2].service).to.be.equals('a')
        expect(err.rootCause.hops[2].app).to.be.exists()
        expect(err.rootCause.hops[2].ts).to.be.exists()

        hemera.close()
        done()
      })
    })
  })

  it('Error propagation with super errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        const a = new UnauthorizedError('test')
        a.test = 444
        cb(a)
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        expect(err.name).to.be.equals('Unauthorized')
        expect(err.message).to.be.equals('test')
        expect(err.test).to.be.equals(444)

        expect(err.hops[0].method).to.be.equals('cmd:b,topic:b')
        expect(err.hops[0].service).to.be.equals('b')
        expect(err.hops[0].app).to.be.exists()
        expect(err.hops[0].ts).to.be.exists()

        expect(err.hops[1].method).to.be.equals('cmd:c,topic:c')
        expect(err.hops[1].service).to.be.equals('c')
        expect(err.hops[1].app).to.be.exists()
        expect(err.hops[1].ts).to.be.exists()

        expect(err.hops[2].method).to.be.equals('cmd:a,topic:a')
        expect(err.hops[2].service).to.be.equals('a')
        expect(err.hops[2].app).to.be.exists()
        expect(err.hops[2].ts).to.be.exists()

        hemera.close()
        done()
      })
    })
  })
})
