'use strict'

describe('onClose extension', function() {
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

  it('Should be able to add onClose extension handler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let firstOnCloseHandler = Sinon.spy()
    let secondOnCloseHandler = Sinon.spy()

    hemera.ext('onClose', function(ctx, next) {
      firstOnCloseHandler()
      next()
    })

    // Plugin
    let plugin = function(hemera, options, done) {
      hemera.ext('onClose', function(ctx, next) {
        secondOnCloseHandler()
        next()
      })

      done()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(() => {
      hemera.close(x => {
        expect(secondOnCloseHandler.callCount).to.be.equals(1)
        expect(firstOnCloseHandler.callCount).to.be.equals(1)
        done()
      })
    })
  })

  it('Should be able to pass an error to onClose extension handler', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let firstOnCloseHandler = Sinon.spy()
    let secondOnCloseHandler = Sinon.spy()

    hemera.ext('onClose', function(ctx, next) {
      firstOnCloseHandler()
      next()
    })

    // Plugin
    let plugin = function(hemera, options, done) {
      hemera.ext('onClose', function(ctx, next) {
        secondOnCloseHandler()
        next(new Error('test'))
      })

      done()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.on('error', err => {
      expect(err.message).to.be.equals('test')
      done()
    })

    hemera.ready(x => {
      hemera.close(x => {
        expect(secondOnCloseHandler.callCount).to.be.equals(1)
        expect(firstOnCloseHandler.callCount).to.be.equals(1)
      })
    })
  })
})
