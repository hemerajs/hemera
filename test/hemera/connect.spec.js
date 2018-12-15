'use strict'

describe('Connect', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should also be ready even when nats connection was already established', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    nats.on('connect', () => {
      hemera.ready(err => {
        expect(err).to.be.not.exists()
        done()
      })
    })
  })
})
