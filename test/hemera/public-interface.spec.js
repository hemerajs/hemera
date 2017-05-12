'use strict'

describe('Public interface', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('public getter', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    expect(hemera.transport).to.be.exists()
    expect(hemera.topics).to.be.exists()
    expect(hemera.router).to.be.exists()

    hemera.close()
    done()
  })

  it('public set options', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    expect(hemera.setOption).to.be.exists()
    expect(hemera.setConfig).to.be.exists()

    hemera.close()
    done()
  })
})