'use strict'

describe('Root Decorator', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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

  it('Should be able to access decorator inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.decorate('test', 1)

    let plugin = Hp(
      function(hemera, options, next) {
        expect(hemera.test).to.be.equals(1)
        next()
      },
      {
        name: 'myPlugin'
      }
    )

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      hemera.close(done)
    })
  })

  it('Should throw error because could not resolve all decorate deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.decorate('b', 1, ['a'])
      } catch (err) {
        expect(err.message).to.be.equals("Missing member dependency 'a'")
        hemera.close(done)
      }
    })
  })

  it('Should satisfy all decorate deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.decorate('a', 2)
      hemera.decorate('b', 1, ['a'])
      hemera.close(done)
    })
  })

  it('Should not be possible to override a decoration', function(done) {
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

  it('Should be able to check if a decorator exists', function(done) {
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
