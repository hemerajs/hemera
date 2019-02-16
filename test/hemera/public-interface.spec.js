'use strict'

describe('Public interface', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('public getters', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    expect(hemera.transport).to.be.exists()
    expect(hemera.topics).to.be.exists()
    expect(hemera.router).to.be.exists()

    hemera.close(done)
  })
})
