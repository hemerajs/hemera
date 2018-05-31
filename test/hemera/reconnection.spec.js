'use strict'

describe('NATS reconnection', function() {
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

  it('Should emit error when nats emit "close" event', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      // in case of no error handler it will throw
      hemera.once('error', err => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('NATS connection closed!')
        hemera.close(done)
      })
      // Is emitted when reconnect has failed or other reasons
      nats.emit('close')
    })
  })
})
