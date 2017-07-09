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

    expect(throws).to.throw(Error)
    hemera.close()
    done()
  })

  it('Should throw an error because plugin function is not a function', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const throws = function () {
      // Plugin
      let plugin = HemeraPlugin(true, '1')

      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: {}
      })

      hemera.ready()
    }

    expect(throws).to.throw(Error, 'hemera-plugin expects a function, instead got a \'boolean\'')
    hemera.close()
    done()
  })

  it('Should throw an error because plugin version is not a string', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const throws = function () {
      // Plugin
      let plugin = HemeraPlugin(() => {}, true)

      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: {}
      })

      hemera.ready()
    }

    expect(throws).to.throw(Error, 'hemera-plugin expects a version string as second parameter, instead got \'boolean\'')
    hemera.close()
    done()
  })
})
