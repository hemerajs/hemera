'use strict'

const HemeraPlugin = require('./../../packages/hemera-plugin')

describe('Hemera plugin', function () {
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

  it('Should register a plugin', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = HemeraPlugin(function (opts, next) {
      next()
    })

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: {}
    })

    hemera.ready(() => {
      hemera.close()
      done()
    })
  })

  it('Should throw an error because semver version does not match', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const throws = function () {

      // Plugin
      let plugin = HemeraPlugin(function (opts, next) {
        next()
      }, '500.400.300')

      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: {}
      })

      hemera.ready()
    }

    expect(throws).to.throw(Error, "hemera-plugin - expected '500.400.300' nats-hemera version, '1.2.16' is installed")
    hemera.close()
    done()
  })
})
