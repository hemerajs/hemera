'use strict'

describe('Publish / Subscribe', function () {
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

  it('Should be able to publish one message to one subscriber (1 to 1 without reply)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        hemera.close()
        done()
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })
    })
  })

  it('Should be able to publish even with a callback', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        hemera.close()
        done()
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, () => {})
    })
  })

  it('Should be able to use normal publish/subscribe behaviour (1 to many)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera1 = new Hemera(nats)

    let counter = 0

    function called () {
      counter++

      if (counter === 2) {
        hemera1.close()
        hemera2.close()
        done()
      }
    }

    hemera1.ready(() => {
      hemera1.add({
        pubsub$: true,
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        called()
      })
    })

    const hemera2 = new Hemera(nats)

    hemera2.ready(() => {
      hemera2.add({
        pubsub$: true,
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        called()
      })

      hemera2.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })
    })
  })

  it('Should crash on unhandled business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      setTimeout(() => {
        expect(stub.called).to.be.equals(true)

        hemera.close()
        done()
      }, 100)
    })
  })

  it('Should not crash on unhandled business errors when crashOnFatal is set to false', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      setTimeout(() => {
        expect(stub.called).to.be.equals(false)

        hemera.close()
        done()
      }, 100)
    })
  })
})
