'use strict'

describe('Connect', function() {
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

  it('Should be ready even when nats connection was already established', function(done) {
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
