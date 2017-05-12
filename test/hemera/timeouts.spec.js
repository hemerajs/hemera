'use strict'

describe('Timeouts', function () {
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

  it('Should not receive more messages when the INBOX timeouts', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let aError = 0
    let bError = 0
    let aResult = 0
    let bResult = 0

    hemera.ready(() => {
      hemera.add({
        topic: 'test',
        cmd: 'A'
      }, (resp, cb) => {
        setTimeout(() => {
          cb(null, {
            ok: true
          })
        }, 250)
      })

      hemera.add({
        topic: 'test',
        cmd: 'B'
      }, function (resp, cb) {
        this.act({
          topic: 'test',
          cmd: 'A',
          timeout$: 100
        }, function (err, res) {
          if (err) {
            aError++
            cb(err)
          } else {
            aResult++
            cb(null, res)
          }
        })
      })

      hemera.act({
        topic: 'test',
        cmd: 'B',
        timeout$: 150
      }, function (err, resp) {
        if (err) {
          bError++
        } else {
          bResult++
        }
      })

      setTimeout(() => {
        expect(aError).to.be.equals(1)
        expect(aResult).to.be.equals(0)
        expect(bError).to.be.equals(1)
        expect(bResult).to.be.equals(0)
        hemera.close()
        done()
      }, 300)
    })
  })

  it('Should not receive more messages with maxMessages$ set when the INBOX timeouts', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let aError = 0
    let bError = 0
    let aResult = 0
    let bResult = 0

    hemera.ready(() => {
      hemera.add({
        topic: 'test',
        cmd: 'A'
      }, (resp, cb) => {
        setTimeout(() => {
          cb(null, {
            ok: true
          })
        }, 250)
      })

      hemera.add({
        topic: 'test',
        cmd: 'B'
      }, function (resp, cb) {
        this.act({
          topic: 'test',
          cmd: 'A',
          timeout$: 100
        }, function (err, res) {
          if (err) {
            aError++
            cb(err)
          } else {
            aResult++
            cb(null, res)
          }
        })
      })

      hemera.act({
        topic: 'test',
        cmd: 'B',
        timeout$: 150,
        maxMessages$: 10
      }, function (err, resp) {
        if (err) {
          bError++
        } else {
          bResult++
        }
      })

      setTimeout(() => {
        expect(aError).to.be.equals(1)
        expect(aResult).to.be.equals(0)
        expect(bError).to.be.equals(1)
        expect(bResult).to.be.equals(0)
        hemera.close()
        done()
      }, 300)
    })
  })
})

describe('Timeouts', function () {
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

  it('Should throw timeout error when callback is not fired', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        setTimeout(() => {
          expect(err).to.be.exists()
          expect(resp).not.to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(err.message).to.be.equals('Timeout')
          hemera.close()
          done()
        }, 200)
      })
    })
  })

  it('Should be able listen on client timeout events in onClientPostRequest', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    let event = Sinon.spy()

    hemera.ready(() => {
      hemera.on('clientPostRequest', function () {
        const ctx = this
        const err = ctx._response.error

        expect(err).to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')

        event()
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(event.called).to.be.equals(true)
        expect(resp).not.to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')
        hemera.close()
        done()
      })
    })
  })

  it('Should throw timeout error when pattern is not defined on the network', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(resp).not.to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')
        hemera.close()
        done()
      })
    })
  })
})