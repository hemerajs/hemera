'use strict'

describe('onClose extension error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to pass an error to onClose extension handler', function(done) {
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

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      hemera.close(err => {
        expect(err.message).to.be.equals('test')
        expect(secondOnCloseHandler.callCount).to.be.equals(1)
        expect(firstOnCloseHandler.callCount).to.be.equals(1)
        done()
      })
    })
  })
})
