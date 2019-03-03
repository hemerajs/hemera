'use strict'

describe('Extension error', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Invalid extension type', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.ext('test', function(ctx, next) {})
      } catch (e) {
        expect(e.name).to.be.equals('HemeraError')
        expect(e.message).to.be.equals('Extension type is unknown')
        hemera.close(done)
      }
    })
  })

  it('Invalid extension handler type', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.ext('preHandler', 'foo')
      } catch (e) {
        expect(e.name).to.be.equals('HemeraError')
        expect(e.message).to.be.equals('Extension handler must be a function')
        hemera.close(done)
      }
    })
  })
})
