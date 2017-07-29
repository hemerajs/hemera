'use strict'

describe('Decorator', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able add a decorator', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.decorate('d', () => true)
      let result = hemera.d()
      expect(result).to.be.equals(true)
      hemera.close()
      done()
    })
  })

  it('Should not be possible to override an decoration', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.decorate('d', () => true)
        hemera.decorate('d', () => true)
      } catch (e) {
        expect(e).to.be.exists()
        expect(e.message).to.be.equals('Server decoration already defined')
        hemera.close()
        done()
      }
    })
  })

  it('Should not be possible to override a built in method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.decorate('act', () => true)
      } catch (e) {
        expect(e).to.be.exists()
        expect(e.message).to.be.equals('Cannot override the built-in server interface method')
        hemera.close()
        done()
      }
    })
  })

  it('Decorator are not plugin scoped', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options) {
      let hemera = this
      hemera.decorate('d', () => true)
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      }
    })

    hemera.ready(() => {
      let result = hemera.d()
      expect(result).to.be.equals(true)
      expect(hemera._decorations['d'].plugin.attributes.name).to.be.equals('myPlugin')
      hemera.close()
      done()
    })
  })
})
