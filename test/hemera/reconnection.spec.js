'use strict'

describe('NATS reconnection', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should log error when nats emit "close" event', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var logSpy = Sinon.spy(hemera.log, 'error')

    hemera.ready(() => {
      // Is emitted when reconnect has failed or other reasons
      nats.emit('close')
    })

    nats.once('close', () => {
      expect(
        logSpy.firstCall.args[0] instanceof Hemera.errors.HemeraError
      ).to.be.equals(true)
      hemera.close(done)
    })
  })
})
