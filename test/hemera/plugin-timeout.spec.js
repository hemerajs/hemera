'use strict'

describe('Plugin timeout', function() {
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

  it('Should produce an error when plugin could not be load within timeout', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      pluginTimeout: 100
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        // done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(err => {
      expect(err).to.be.exists()
      expect(err.code).to.be.equals('ERR_AVVIO_PLUGIN_TIMEOUT')
      hemera.close(done)
    })
  })

  it('Should be able to get the name of the plugin which produce the timeout', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      pluginTimeout: 100
    })

    // Plugin
    let myPlugin = Hp(
      function myPlugin(hemera, options, done) {
        // done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(err => {
      expect(err).to.be.exists()
      expect(err.code).to.be.equals('ERR_AVVIO_PLUGIN_TIMEOUT')
      expect(err.fn.name).to.be.equals('myPlugin')
      expect(err.fn[Symbol.for('plugin-meta')]).to.be.equals({
        name: 'myPlugin',
        options: { a: 1 }
      })
      hemera.close(done)
    })
  })

  it('Should not produce an error when timeout is zero', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      pluginTimeout: 0
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        setTimeout(() => {
          done()
        }, 10)
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      hemera.close(done)
    })
  })
})
