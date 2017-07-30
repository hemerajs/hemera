'use strict'

describe('Plugin interface', function () {
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

  it('Should be able to use a plugin', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.expose('test', 1)

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    let pluginOptions = {
      a: '1'
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(hemera.exposition.myPlugin.test).to.be.equals(1)

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).not.to.be.equals(3)
        hemera.close(done)
      })
    })
  })

  it('Should be able to get a map of registered plugins', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin1 = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin1,
      attributes: {
        name: 'myPlugin1'
      },
      options: pluginOptions
    })

    // Plugin
    let plugin2 = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add2'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin2,
      attributes: {
        name: 'myPlugin2'
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(JSON.parse(JSON.stringify(hemera.plugins))).to.include({
        core: {
          attributes: {
            name: 'core'
          },
          options: {}
        },
        myPlugin1: {
          attributes: {
            name: 'myPlugin1'
          },
          parentPluginName: 'core',
          options: {
            a: '1'
          }
        },
        myPlugin2: {
          attributes: {
            name: 'myPlugin2'
          },
          parentPluginName: 'core',
          options: {
            a: '1'
          }
        }
      })

      hemera.close(done)
    })
  })

  it('Should be able to register the plugin twice when multiple attribute is set to true', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2'
        },
        options: pluginOptions
      })
    }

    // Plugin
    let plugin2 = function (options) {}

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: pluginOptions
      })
      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2',
          multiple: true
        },
        options: pluginOptions
      })
      hemera.close(done)
    } catch (err) {
      expect(err).to.be.not.exists()
    }
  })

  it('Should thrown an error when the plugin is registered twice when multiple attribute is not set to true', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2'
        },
        options: pluginOptions
      })
    }

    // Plugin
    let plugin2 = function (options) {}

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: pluginOptions
      })
      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2',
          multiple: false
        },
        options: pluginOptions
      })
      hemera.close(done)
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Plugin was already registered')
      hemera.close(done)
    }
  })

  it('Should thrown plugin error during initialization', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options, next) {
      next(new Error('test'))
    }

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        }
      })
      hemera.close(done)
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Error during plugin registration')
      expect(err.cause).to.be.equals('Error')
      expect(err.cause).to.be.equals('test')
      hemera.close(done)
    }
  })

  it('Should thrown super plugin error during initialization', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options, next) {
      next(new UnauthorizedError('Shit!'))
    }

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        }
      })
      hemera.close(done)
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('Unauthorized')
      expect(err.message).to.be.equals('Shit!')
      hemera.close(done)
    }
  })

  it('Plugin name is required', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    try {
      hemera.use({
        plugin: plugin,
        attributes: {},
        options: pluginOptions
      })
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Plugin name is required')
      hemera.close(done)
    }
  })

  it('Should be able to specify plugin options as second argument in use method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'foo',
        description: 'test',
        version: '1.0.0'
      }
    }, pluginOptions)

    hemera.ready(() => {
      expect(hemera.plugins.foo.options.a).to.be.equals('1')
      hemera.close(done)
    })
  })

  it('Should not overwrite plugin default options when options are passed as second argument', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: 1
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      expect(options.a).to.be.equals(1)

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    const defaultOptions = {
      a: 33
    }

    hemera.use({
      plugin: plugin,
      options: defaultOptions,
      attributes: {
        name: 'foo',
        description: 'test',
        version: '1.0.0'
      }
    }, pluginOptions)

    hemera.ready(() => {
      expect(hemera.plugins.foo.options.a).to.be.equals(1)
      expect(defaultOptions.a).to.be.equals(33)
      hemera.close(done)
    })
  })

  it('Should not overwrite plugin default options', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.setOption('a', 1)

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    const defaultOptions = {
      a: 33
    }

    hemera.use({
      plugin: plugin,
      options: defaultOptions,
      attributes: {
        name: 'foo',
        description: 'test',
        version: '1.0.0'
      }
    })

    hemera.ready(() => {
      expect(hemera.plugins.foo.options.a).to.be.equals(1)
      expect(defaultOptions.a).to.be.equals(33)
      hemera.close(done)
    })
  })

  it('Should be able to specify plugin attributes by package.json', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    const packageJson = {
      name: 'foo',
      description: 'test',
      version: '1.0.0'
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        pkg: packageJson
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(hemera.plugins.foo.attributes.name).to.be.equals('foo')
      expect(hemera.plugins.foo.attributes.description).to.be.equals('test')
      expect(hemera.plugins.foo.attributes.version).to.be.equals('1.0.0')
      expect(hemera.plugins.foo.options).to.be.equals(pluginOptions)
      hemera.close(done)
    })
  })

  it('Should be able to use child logger', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      childLogger: true
    })

    let plugin = function (options) {
      this.log.info('test')
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      }
    })

    hemera.close(done)
  })

  it('Should emit timeout error when plugin callback was not called within time range', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      childLogger: true,
      logLevel: 'silent',
      pluginTimeout: 1000
    })

    hemera.on('error', (err) => {
      expect(err instanceof Hemera.errors.HemeraError).to.be.equals(true)
      expect(err.cause instanceof Hemera.errors.PluginTimeoutError).to.be.equals(true)
      done()
    })

    let plugin = function (options, next) {
      this.log.info('test')
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      }
    })
    hemera.ready()
  })
})
