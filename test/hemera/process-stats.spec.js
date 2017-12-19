'use strict'

describe('Process stats', function() {
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

  it('Should return informations about the current load of the running process', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      load: {
        process: {
          sampleInterval: 1
        }
      }
    })

    hemera.ready(() => {
      const load = hemera.load

      expect(load.eventLoopDelay).to.be.number()
      expect(load.heapUsed).to.be.number()
      expect(load.rss).to.be.number()

      hemera.close(done)
    })
  })
})
