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
    let myPlugin = function(hemera, options, done) {
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

    myPlugin[Symbol.for('name')] = 'myPlugin'
    myPlugin[Symbol.for('options')] = { a: 1 }

    hemera.use(myPlugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    let plugin2 = function(hemera, options, done) {
      done()
    }

    plugin2[Symbol.for('name')] = 'myPlugin2'
    plugin2[Symbol.for('options')] = { a: 2 }

    hemera.use([plugin, plugin2])

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.plugins.myPlugin.plugin$.options).to.be.equals({
        a: 1
      })
      expect(hemera.plugins.myPlugin2.plugin$.options).to.be.equals({
        a: 2
      })
      hemera.close(done)
    })
  })

  it('Should be able to register a callback after an array of plugins was registered', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    // Plugin
    let plugin = function(hemera, options, done) {
      done()
    }

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    let plugin2 = function(hemera, options, done) {
      done()
    }

    plugin2[Symbol.for('name')] = 'myPlugin2'
    plugin2[Symbol.for('options')] = { a: 2 }

    hemera.use([plugin, plugin2]).after(err => {
      expect(err).to.be.not.exists()
      spy()
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(spy.calledOnce).to.be.equals(true)
      expect(hemera.plugins.myPlugin.plugin$.options.a).to.be.equals(1)
      expect(hemera.plugins.myPlugin2.plugin$.options.a).to.be.equals(2)
      expect(hemera.plugins['anonymous-4']).to.be.exists()
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

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    hemera.use(plugin).after(err => {
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

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    hemera.use(plugin)

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
      let plugin2 = function(hemera, options, done) {
        done()
      }

      plugin2[Symbol.for('name')] = 'myPlugin2'
      plugin2[Symbol.for('options')] = { a: 2 }

      hemera.use(plugin2)

      done()
    }

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(Object.keys(hemera.plugins)).to.be.equals([
        'core',
        'myPlugin',
        'myPlugin2'
      ])
      expect(hemera.plugins.myPlugin.plugin$.options).to.be.equals({
        a: 1
      })
      expect(hemera.plugins.myPlugin2.plugin$.options).to.be.equals({
        a: 2
      })
      hemera.close(done)
    })
  })

  it('Plugin is encapsulated', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = function(hemera, options, done) {
      let plugin = function(hemera, options, done) {
        hemera.decorate('test', true)
        expect(hemera.test).to.be.exists()
        done()
      }

      plugin[Symbol.for('name')] = 'myPlugin'

      let plugin2 = function(hemera, options, done) {
        expect(hemera.test).to.be.exists()
        done()
      }

      plugin2[Symbol.for('name')] = 'myPlugin2'

      hemera.use([plugin, plugin2])

      done()
    }

    parent[Symbol.for('name')] = 'parent'

    hemera.use(parent)

    hemera.use(function(hemera, options, done) {
      expect(hemera.test).to.be.not.exists()
      done()
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.test).to.be.not.exists()

      expect(Object.keys(hemera.plugins)).to.be.equals([
        'core',
        'parent',
        'myPlugin',
        'myPlugin2',
        'anonymous-5'
      ])
      hemera.close(done)
    })
  })

  it('Should be able to pass a callback after plugins was initialized', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, done) {
      done()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin).after(err => {
      expect(err).to.be.not.exists()
      hemera.close(done)
    })

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready()
  })

  it('Should be able to decorate the prototype chain', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)
      next()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.equals(1)
      expect(hemera.plugins.myPlugin.test).to.be.equals(1)
      hemera.close(done)
    })
  })

  it('Should be able to pass plugin options', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      expect(options).to.be.equals({
        a: 33,
        test: 5
      })
      next()
    }

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('options')] = { a: 1 }

    hemera.use(plugin, { test: 5, a: 33 })

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.plugins.myPlugin.plugin$.options).to.be.equals({
        a: 33,
        test: 5
      })
      hemera.close(done)
    })
  })

  it('Should be able to access the decorated prototype propertys inside nested plugins', function(
    done
  ) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)

      expect(hemera.test).to.be.equals(1)

      let plugin2 = function(hemera, options, next) {
        expect(hemera.test).to.be.equals(1)
        next()
      }

      plugin2[Symbol.for('name')] = 'myPlugin2'

      hemera.use(plugin2)

      next()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

    hemera.use(plugin)

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

    hemera.use(plugin)

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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

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

  it('Should be able to use child logger', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      childLogger: true
    })

    let plugin = function(hemera, options, done) {
      hemera.log.info('test')
      done()
    }

    hemera.use(plugin)

    hemera.close(done)
  })
})
