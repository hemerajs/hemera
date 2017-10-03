'use strict'

describe('Plugin interface', function() {
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

  it('Should be able to use a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      expect(options.a).to.be.equals('1')

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      done()
    }

    let pluginOptions = {
      name: 'myPlugin',
      a: '1'
    }

    hemera.use({
      plugin: plugin,
      options: pluginOptions
    })

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).not.to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to register an array of plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      done()
    }

    let plugin2 = function(hemera, options, done) {
      done()
    }

    hemera.use([
      {
        plugin: plugin,
        options: {
          name: 'myPlugin',
          a: 1
        }
      },
      {
        plugin: plugin2,
        options: {
          name: 'myPlugin2',
          a: 2
        }
      }
    ])

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.plugins.myPlugin.plugin$.options.a).to.be.equals(1)
      expect(hemera.plugins.myPlugin2.plugin$.options.a).to.be.equals(2)
      hemera.close(done)
    })
  })

  it('Should be able to use after', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      done()
    }

    let pluginOptions = {
      name: 'myPlugin',
      a: '1'
    }

    hemera
      .use({
        plugin: plugin,
        options: pluginOptions
      })
      .after(err => {
        expect(err).to.be.not.exists()
        hemera.close(done)
      })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
    })
  })

  it('Should be able to use after on root', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      done()
    }

    let pluginOptions = {
      name: 'myPlugin',
      a: '1'
    }

    hemera.use({
      plugin: plugin,
      options: pluginOptions
    })

    hemera.after(err => {
      expect(err).to.be.not.exists()
      hemera.close(done)
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
    })
  })

  it('Should be able to register a plugin in a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      hemera.use({
        plugin: (hemera, opts, done) => {
          done()
        },
        options: { name: 'foo' }
      })

      done()
    }

    hemera.use({
      plugin,
      options: { name: 'bar' }
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(Object.keys(hemera.plugins)).to.be.equals(['core', 'bar', 'foo'])
      hemera.close(done)
    })
  })

  it('Should be able to pass a callback after plugins was initialized', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      done()
    }

    let pluginOptions = {
      name: 'myPlugin',
      a: '1'
    }

    hemera.use(
      {
        plugin: plugin,
        options: pluginOptions
      },
      err => {
        expect(err).to.be.not.exists()
        hemera.close(done)
      }
    )

    hemera.ready(err => {
      expect(err).to.be.not.exists()
    })
  })

  it('Should be able to list all plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, done) {
      done()
    }

    let pluginOptions = {
      name: 'myPlugin'
    }

    hemera.use({
      plugin: plugin,
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(hemera.plugins).to.be.an.object()
      expect(Object.keys(hemera.plugins)).to.be.equals(['core', 'myPlugin'])
      expect(hemera.plugins.core).to.be.exists()
      expect(hemera.plugins.myPlugin).to.be.exists()
      expect(hemera.plugins.myPlugin instanceof Hemera).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should throw error because could not resolve all decorate deps', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      try {
        hemera.decorate('b', 1, ['a'])
      } catch (err) {
        expect(err.message).to.exists(
          HemeraConstants.MISSING_DECORATE_DEPENDENCY
        )
        hemera.close(done)
      }
      next()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready()
  })

  it('Should satisfy all decorate deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('a', 2)
      hemera.decorate('b', 1, ['a'])
      next()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(() => {
      hemera.close(done)
    })
  })

  it('Should be able to compare plugin hemera errors with instanceof', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      const FooBarError = hemera.createError('FooBarError')

      hemera.decorate('pluginErrors', {
        FooBarError
      })

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(new FooBarError('test'))
        }
      )

      done()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('FooBarError')
          expect(err.message).to.be.equals('test')
          expect(err instanceof hemera.pluginErrors.FooBarError).to.be.equals(
            true
          )
          hemera.close(done)
        }
      )
    })
  })

  it('Should throw an error when we trying to overwrite an existing prototype property', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)
      try {
        hemera.decorate('test', 1)
      } catch (err) {
        expect(err).to.exists()
        hemera.close(done)
      }
      next()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready()
  })

  it('Should be able to decorate the prototype chain', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)
      next()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.equals(1)
      expect(hemera.plugins.myPlugin.test).to.be.equals(1)
      hemera.close(done)
    })
  })

  it('Should thrown plugin error during initialization', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      next(new Error('test'))
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(err => {
      expect(err).to.exists()
      expect(err.name).to.be.equals('Error')
      expect(err.message).to.be.equals('test')
      hemera.close(done)
    })
  })

  it('Should thrown super plugin error during initialization', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, done) {
      done(new UnauthorizedError('test'))
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(err => {
      expect(err).to.exists()
      expect(err.name).to.be.equals('Unauthorized')
      expect(err.message).to.be.equals('test')
      hemera.close(done)
    })
  })

  it('Should not decorate the root prototype chain', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)
      next()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.equals(1)
      expect(hemera.plugins.myPlugin.test).to.be.equals(1)

      let hemera2 = new Hemera(nats)
      expect(hemera2.test).to.not.exists()
      hemera.close(() => {
        hemera2.close(done)
      })
    })
  })

  it('Plugin name is required', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function(options) {
      let hemera = this

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )
    }

    try {
      hemera.use({
        plugin: plugin,
        options: pluginOptions
      })
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Plugin name is required')
      hemera.close(done)
    }
  })

  it('Should be able to specify plugin options as second argument in use method', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function(hemera, options, done) {
      expect(options.a).to.be.equals('1')

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      done()
    }

    hemera.use(
      {
        plugin: plugin,
        options: {
          name: 'foo'
        }
      },
      pluginOptions
    )

    hemera.ready(() => {
      expect(hemera.plugins.foo.plugin$.options.a).to.be.equals('1')
      hemera.close(done)
    })
  })

  it('Should not overwrite plugin default options when options are passed as second argument', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: 1
    }

    // Plugin
    let plugin = function(hemera, options, done) {
      expect(options.a).to.be.equals(1)

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      done()
    }

    const defaultOptions = {
      name: 'foo',
      a: 33
    }

    hemera.use(
      {
        plugin: plugin,
        options: defaultOptions
      },
      pluginOptions
    )

    hemera.ready(() => {
      expect(hemera.plugins.foo.plugin$.options.a).to.be.equals(1)
      expect(defaultOptions.a).to.be.equals(33)
      hemera.close(done)
    })
  })

  it('Should not modify original plugin default options', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function(hemera, options, done) {
      hemera.setOption('a', 1)

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      done()
    }

    const defaultOptions = {
      name: 'foo',
      a: 33
    }

    hemera.use({
      plugin: plugin,
      options: defaultOptions
    })

    hemera.ready(() => {
      expect(hemera.plugins.foo.plugin$.options.a).to.be.equals(1)
      expect(defaultOptions.a).to.be.equals(33)
      hemera.close(done)
    })
  })

  it('Should be able to use child logger', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      childLogger: true
    })

    let plugin = function(hemera, options, done) {
      hemera.log.info('test')
      done()
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin'
      }
    })

    hemera.close(done)
  })
})
