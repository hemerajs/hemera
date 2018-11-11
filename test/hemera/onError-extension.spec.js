'use strict'

describe('onError extension', function() {
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

  it('Should be able to add onError extension handler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let spy = Sinon.spy()
    hemera.ext('onError', (ctx, request, { error }, next) => {
      spy()
      expect(error.name).to.be.equals('Error')
      expect(error.message).to.be.equals('TEST')
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Error('TEST'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('TEST')
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
      hemera.ext('onError', function(ctx, req, reply, next) {
        next()
        spyPlugin1ExtensionHandler()
      })

      hemera.add(
        {
          cmd: 'foo',
          topic: 'math'
        },
        (resp, cb) => {
          cb(new Error('test'))
        }
      )

      done()
    }

    hemera.use(plugin1)

    let plugin2 = function(hemera, options, done) {
      hemera.ext('onError', function(ctx, req, reply, next) {
        next()
        spyPlugin2ExtensionHandler()
      })

      hemera.add(
        {
          cmd: 'bar',
          topic: 'math'
        },
        (resp, cb) => {
          cb(new Error('test'))
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
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(spyPlugin1ExtensionHandler.calledOnce).to.be.equals(true)
          expect(spyPlugin2ExtensionHandler.called).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })
})
