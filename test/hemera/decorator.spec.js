'use strict'

describe('Root Decorator', function() {
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

  it('Should be able add a decorator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.decorate('d', () => true)
      expect(hemera.d).to.be.function()
      hemera.close(done)
    })
  })

  it('Should not be possible to override an decoration', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.decorate('d', 1)
        hemera.decorate('d', 1)
      } catch (err) {
        expect(err).to.exists()
        hemera.close(done)
      }
    })
  })

  it('Should be able add to check if a decorator exists', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.decorate('d', () => true)
      expect(hemera.hasDecorator('d')).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should not extend the prototype', function(done) {
    const nats = require('nats').connect(authUrl)

    let hemera1 = new Hemera(nats)
    hemera1.decorate('fooBar', 1)
    let hemera2 = new Hemera(nats)
    expect(hemera2.hasDecorator('fooBar')).to.be.equals(false)
    hemera1.close(() => {
      hemera2.close(done)
    })
  })

})
