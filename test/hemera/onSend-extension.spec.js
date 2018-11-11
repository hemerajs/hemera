'use strict'

describe('onSend extension', function() {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    server.kill()
  })

  it('Should be able to add onSend extension handler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let spy = Sinon.spy()
    hemera.ext('onSend', (state, request, reply, next) => {
      spy()
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to define different handlers in plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spyPlugin1ExtensionHandler = Sinon.spy()
    const spyPlugin2ExtensionHandler = Sinon.spy()

    let plugin1 = function(hemera, options, done) {
      hemera.ext('onSend', (state, request, reply, next) => {
        spyPlugin1ExtensionHandler()
        next()
      })

      hemera.add(
        {
          cmd: 'foo',
          topic: 'math'
        },
        (resp, cb) => {
          cb()
        }
      )

      done()
    }

    hemera.use(plugin1)

    let plugin2 = function(hemera, options, done) {
      hemera.ext('onSend', (state, request, reply, next) => {
        spyPlugin2ExtensionHandler()
        next()
      })

      hemera.add(
        {
          cmd: 'bar',
          topic: 'math'
        },
        (resp, cb) => {
          cb()
        }
      )

      done()
    }

    hemera.use(plugin2)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'foo'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(spyPlugin1ExtensionHandler.calledOnce).to.be.equals(true)
          expect(spyPlugin2ExtensionHandler.called).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })
})
