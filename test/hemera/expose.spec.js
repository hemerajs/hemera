'use strict'

describe('Expose', function() {
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

  it('Should be able add a exposition', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.expose('d', () => true)
      expect(hemera.d).to.be.function()
      hemera.close(done)
    })
  })

  it('Should be able to access expositions inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.expose('test', 1)

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

  it('Expositions are encapsulated inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, next) {
        hemera.expose('test', 1)
        hemera.use(plugin2)
        next()
      },
      {
        name: 'myPlugin'
      }
    )

    hemera.use(plugin)

    let plugin2 = Hp(
      function(hemera, options, next) {
        expect(hemera.test).to.be.to.exists()
        next()
      },
      {
        name: 'myPlugin2'
      }
    )

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.not.exists()
      hemera.close(done)
    })
  })

  it('Should satisfy all expose deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.expose('a', 2)
      hemera.expose('b', 1, ['a'])
      hemera.close(done)
    })
  })

  it('Should not be possible to override an exposition', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.expose('d', 1)
        hemera.expose('d', 1)
      } catch (err) {
        expect(err).to.exists()
        hemera.close(done)
      }
    })
  })

  it('Should throw error because could not resolve all expose deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.expose('b', 1, ['a'])
      } catch (err) {
        expect(err.message).to.be.equals("Missing member dependency 'a'")
        hemera.close(done)
      }
    })
  })
})
