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

  it('Should pass plugin options', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let myPlugin = function(hemera, options, done) {
      expect(options).to.be.equals({ a: 1 })

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

  it('Should merge plugin options and respect reference values', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let ref = { b: 2 }

    // Plugin
    let myPlugin = function(hemera, options, done) {
      expect(options).to.be.equals({ a: 1, ref })
      expect(ref).to.be.shallow.equals(ref)

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
    myPlugin[Symbol.for('options')] = { a: 1, ref }

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

  it('Should merge default plugin options / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let myPlugin = function(hemera, options, done) {
      expect(options).to.be.equals({
        port: 3000,
        host: '127.0.0.1',
        errors: {
          propBlacklist: []
        },
        pattern: {}
      })

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
    myPlugin[Symbol.for('options')] = {
      port: 3000,
      host: '127.0.0.1',
      errors: {
        propBlacklist: ['stack']
      },
      pattern: {}
    }

    hemera.use(myPlugin, {
      errors: {
        propBlacklist: []
      }
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

  it('Should load plugins only on ready', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const pluginCb = Sinon.spy()

    // Plugin
    let myPlugin = function(hemera, options, done) {
      pluginCb()
      done()
    }

    myPlugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(myPlugin)

    setTimeout(() => {
      expect(pluginCb.called).to.be.equals(false)
      hemera.ready(() => {
        expect(pluginCb.calledOnce).to.be.equals(true)
        hemera.close(done)
      })
    }, 100)
  })

  it('Should be able to register extensions globally inside plugin when scoped is skipped', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    function plugin(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext1()
        next()
      })
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
    plugin[Symbol.for('skip-override')] = true
    hemera.use(plugin)

    function plugin2(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

      done()
    }
    plugin2[Symbol.for('skip-override')] = true
    hemera.use(plugin2)

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
          expect(ext1.calledOnce).to.be.equals(true)
          expect(ext2.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not be able to add extensions for upper scope inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

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

    function plugin(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext1()
        next()
      })
      done()
    }
    hemera.use(plugin)

    function plugin2(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

      done()
    }
    hemera.use(plugin2)

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
          expect(ext1.calledOnce).to.be.equals(false)
          expect(ext2.calledOnce).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not be able to add extensions and influence other independent scopes', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()
    let ext3 = Sinon.spy()

    function plugin(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext1()
        next()
      })
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
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

      done()
    }
    hemera.use(plugin)

    function plugin2(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext3()
        next()
      })

      done()
    }
    hemera.use(plugin2)

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
          expect(ext1.calledOnce).to.be.equals(true)
          expect(ext2.calledOnce).to.be.equals(true)
          expect(ext3.calledOnce).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass extensions from upper scope to lower scope', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()
    let ext3 = Sinon.spy()
    let ext4 = Sinon.spy()

    hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
      ext1()
      next()
    })

    function plugin(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

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

      function plugin2(hemera, options, done) {
        hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
          ext3()
          next()
        })

        done()
      }

      hemera.use(plugin2)

      done()
    }
    hemera.use(plugin)

    function plugin3(hemera, options, done) {
      hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
        ext4()
        next()
      })

      done()
    }
    hemera.use(plugin3)

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
          expect(ext1.calledOnce).to.be.equals(true)
          expect(ext2.calledOnce).to.be.equals(true)
          expect(ext3.calledOnce).to.be.equals(false)
          expect(ext4.calledOnce).to.be.equals(false)
          hemera.close(done)
        }
      )
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
        expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
          'myPlugin',
          'myPlugin2'
        ])
        done()
      }

      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'myPlugin'
      ])

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
      expect(hemera[HemeraSymbols.registeredPlugins]).to.be.equals(['myPlugin'])
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
        expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
          'parent',
          'myPlugin'
        ])
        done()
      }

      plugin[Symbol.for('name')] = 'myPlugin'

      let plugin2 = function(hemera, options, done) {
        expect(hemera.test).to.be.exists()
        expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
          'parent',
          'myPlugin',
          'myPlugin2'
        ])
        done()
      }

      plugin2[Symbol.for('name')] = 'myPlugin2'

      hemera.use(plugin)
      hemera.use(plugin2)

      done()
    }

    parent[Symbol.for('name')] = 'parent'

    hemera.use(parent)

    hemera.use(function(hemera, options, done) {
      expect(hemera.test).to.be.not.exists()
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      done()
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.test).to.be.not.exists()

      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      hemera.close(done)
    })
  })

  it('Plugin which is not encapsulated should be registered with name as well', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = function(hemera, options, done) {
      done()
    }

    parent[Symbol.for('skip-override')] = true
    parent[Symbol.for('name')] = 'parent'

    hemera.use(parent)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      hemera.close(done)
    })
  })

  it('Plugin is not encapsulated when use skip-override', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = function(hemera, options, done) {
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      done()
    }

    parent[Symbol.for('skip-override')] = true
    parent[Symbol.for('name')] = 'parent'

    hemera.use(parent)

    hemera.use(function(hemera, options, done) {
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      hemera.use(function(hemera, options, done) {
        expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
          'parent'
        ])
        done()
      })
      done()
    })

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'parent'
      ])
      hemera.close(done)
    })
  })

  it('Should be able to pass a callback after plugins was initialized', function(done) {
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
      expect(hemera[HemeraSymbols.registeredPlugins].slice()).to.be.equals([
        'myPlugin'
      ])
      hemera.close(done)
    })
  })

  it('Should throw error because could not resolve all decorator deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      try {
        hemera.decorate('b', 1, ['a'])
      } catch (err) {
        expect(err.message).to.exists(`Missing decorator dependency 'a'`)
        hemera.close(done)
      }
      next()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready()
  })

  it('Should throw error when dependency was not registered before', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      next()
    }

    plugin[Symbol.for('name')] = 'myPlugin'
    plugin[Symbol.for('dependencies')] = ['test']

    hemera.ready(() => {
      try {
        hemera.checkPluginDependencies(plugin)
      } catch (err) {
        expect(err).to.be.exists()
        done()
      }
    })
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

  it('Should be able to compare plugin hemera errors with instanceof', function(done) {
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

  it('Should throw an error when we trying to overwrite an existing prototype property', function(done) {
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

  it('Should throw an error when we trying to overwrite an existing prototype property / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      hemera.decorate('test', 1)

      let plugin2 = function(hemera, options, next) {
        try {
          hemera.decorate('test', 1)
        } catch (err) {
          expect(err).to.exists()
          hemera.close(done)
        }
        next()
      }

      plugin2[Symbol.for('name')] = 'myPlugin2'
      hemera.use(plugin2)
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
      hemera.close(done)
    })
  })

  it('Should not be able to decorate root instance / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, next) {
      let plugin2 = function(hemera, options, next) {
        hemera.decorate('test', 1)
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
      expect(hemera.test).to.be.not.exists()
      hemera.close(done)
    })
  })

  it('Should be able to access the decorated prototype propertys inside nested plugins', function(done) {
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

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      hemera.close(done)
    })
  })
})
