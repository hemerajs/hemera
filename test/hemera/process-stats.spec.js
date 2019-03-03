'use strict'

describe('Process stats', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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
