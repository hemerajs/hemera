'use strict'

describe('onClose extension', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.close(x => {
        expect(secondOnCloseHandler.callCount).to.be.equals(1)
        expect(firstOnCloseHandler.callCount).to.be.equals(1)
        done()
      })
    })
  })
})
