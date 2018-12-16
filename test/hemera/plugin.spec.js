'use strict'

describe('Plugin interface', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to use a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
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
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

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
    let myPlugin = Hp(
      function(hemera, options, done) {
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
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

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
    let myPlugin = Hp(
      function(hemera, options, done) {
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
      },
      {
        name: 'myPlugin',
        options: { a: 1, ref }
      }
    )

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
    let myPlugin = Hp(
      function(hemera, options, done) {
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
      },
      {
        name: 'myPlugin',
        options: {
          port: 3000,
          host: '127.0.0.1',
          errors: {
            propBlacklist: ['stack']
          },
          pattern: {}
        }
      }
    )

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
    let myPlugin = Hp(function(hemera, options, done) {
      pluginCb()
      done()
    })

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

    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.ext('preHandler', function(ctx, req, res, next) {
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
      },
      {
        scoped: false
      }
    )

    hemera.use(myPlugin)

    let myPlugin2 = Hp(
      function(hemera, options, done) {
        hemera.ext('preHandler', function(ctx, req, res, next) {
          ext2()
          next()
        })

        done()
      },
      {
        scoped: false
      }
    )
    hemera.use(myPlugin2)

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

  it('Should not be able to add extensions for parent scope inside plugins', function(done) {
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

    let myPlugin = Hp(function(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        next()
      })
      done()
    })
    hemera.use(myPlugin)

    let myPlugin2 = Hp(function(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

      done()
    })
    hemera.use(myPlugin2)

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

    let myPlugin = Hp(function(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
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
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        next()
      })

      done()
    })
    hemera.use(myPlugin)

    let myPlugin2 = Hp(function(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext3()
        next()
      })

      done()
    })
    hemera.use(myPlugin2)

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

    hemera.ext('preHandler', function(ctx, req, res, next) {
      ext1()
      next()
    })

    let myPlugin = Hp(function(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
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

      let myPlugin2 = Hp(function(hemera, options, done) {
        hemera.ext('preHandler', function(ctx, req, res, next) {
          ext3()
          next()
        })

        done()
      })

      hemera.use(myPlugin2)

      done()
    })
    hemera.use(myPlugin)

    function plugin3(hemera, options, done) {
      hemera.ext('preHandler', function(ctx, req, res, next) {
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

    let plugin = Hp(function(hemera, options, done) {
      done()
    })

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

    let plugin = Hp(function(hemera, options, done) {
      done()
    })

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
    let plugin = Hp(
      function(hemera, options, done) {
        let plugin2 = Hp(
          function(hemera, options, done) {
            expect(
              hemera[HemeraSymbols.sRegisteredPlugins].slice()
            ).to.be.equals(['myPlugin', 'myPlugin2'])
            done()
          },
          {
            name: 'myPlugin2',
            options: { a: 2 }
          }
        )

        expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
          'myPlugin'
        ])

        hemera.use(plugin2)

        done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera[HemeraSymbols.sRegisteredPlugins]).to.be.equals(['myPlugin'])
      hemera.close(done)
    })
  })

  it('Plugin is encapsulated', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = Hp(
      function(hemera, options, done) {
        let plugin = Hp(
          function(hemera, options, done) {
            hemera.decorate('test', true)
            expect(hemera.test).to.be.exists()
            expect(
              hemera[HemeraSymbols.sRegisteredPlugins].slice()
            ).to.be.equals(['parent', 'myPlugin'])
            done()
          },
          {
            name: 'myPlugin'
          }
        )

        let plugin2 = Hp(
          function(hemera, options, done) {
            expect(hemera.test).to.be.exists()
            expect(
              hemera[HemeraSymbols.sRegisteredPlugins].slice()
            ).to.be.equals(['parent', 'myPlugin', 'myPlugin2'])
            done()
          },
          {
            name: 'myPlugin2'
          }
        )

        hemera.use(plugin)
        hemera.use(plugin2)

        done()
      },
      {
        name: 'parent'
      }
    )

    hemera.use(parent)

    hemera.use(
      Hp(function(hemera, options, done) {
        expect(hemera.test).to.be.exists()
        expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
          'parent',
          'plugin.spec'
        ])
        done()
      })
    )

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.test).to.be.exists()

      expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
        'parent',
        'plugin.spec'
      ])
      hemera.close(done)
    })
  })

  it('Plugin which is not encapsulated should be registered with name as well', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = Hp(
      function(hemera, options, done) {
        done()
      },
      {
        scoped: false,
        name: 'parent'
      }
    )

    hemera.use(parent)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
        'parent'
      ])
      hemera.close(done)
    })
  })

  it('Plugin is not encapsulated when use skip-override', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let parent = Hp(
      function(hemera, options, done) {
        expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
          'parent'
        ])
        done()
      },
      {
        scoped: false,
        name: 'parent'
      }
    )

    hemera.use(parent)

    hemera.use(
      Hp(function(hemera, options, done) {
        expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
          'parent',
          'plugin.spec'
        ])
        hemera.use(
          Hp(function(hemera, options, done) {
            expect(
              hemera[HemeraSymbols.sRegisteredPlugins].slice()
            ).to.be.equals(['parent', 'plugin.spec', 'plugin.spec'])
            done()
          })
        )
        done()
      })
    )

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
        'parent',
        'plugin.spec'
      ])
      hemera.close(done)
    })
  })

  it('Should be able to pass a callback after plugins was initialized', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, done) {
        done()
      },
      {
        name: 'myPlugin'
      }
    )

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

    let plugin = Hp(
      function(hemera, options, done) {
        done()
      },
      {
        name: 'myPlugin'
      }
    )

    hemera.use(plugin)

    hemera.ready(() => {
      expect(hemera[HemeraSymbols.sRegisteredPlugins].slice()).to.be.equals([
        'myPlugin'
      ])
      hemera.close(done)
    })
  })

  it('Should throw when plugin dependency could not be found', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, next) {
        next()
      },
      {
        dependencies: ['hemera-joi']
      }
    )

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err.message).to.be.equals(
        `The dependency 'hemera-joi' is not registered`
      )
      hemera.close(done)
    })
  })

  it('Should reject when plugin dependency could not be found', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, next) {
        next()
      },
      {
        dependencies: ['hemera-joi']
      }
    )

    hemera.use(plugin)

    hemera.ready().catch(err => {
      expect(err.message).to.be.equals(
        `The dependency 'hemera-joi' is not registered`
      )
      hemera.close(done)
    })
  })

  it('Should throw error because could not resolve all decorator deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      try {
        hemera.decorate('b', 1, ['a'])
      } catch (err) {
        expect(err.message).to.equals(`Missing member dependency 'a'`)
        hemera.close(done)
      }
      next()
    })

    hemera.use(plugin)

    hemera.ready()
  })

  it('Should throw error when plugin decorators was not registered before', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, next) {
        next()
      },
      {
        decorators: ['test']
      }
    )

    hemera.use(plugin)
    hemera.ready(err => {
      expect(err).to.be.exists()
      expect(err.message).to.equals(
        `The decorator dependency 'test' is not registered`
      )
      done()
    })
  })

  it('Should reject error when plugin decorators was not registered before', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, next) {
        next()
      },
      {
        decorators: ['test']
      }
    )

    hemera.use(plugin)
    hemera.ready().catch(err => {
      expect(err).to.be.exists()
      expect(err.message).to.equals(
        `The decorator dependency 'test' is not registered`
      )
      done()
    })
  })

  it('Should satisfy all decorate deps', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      hemera.decorate('a', 2)
      hemera.decorate('b', 1, ['a'])
      next()
    })

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.close(done)
    })
  })

  it('Should be able to compare plugin hemera errors with instanceof', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(
      function(hemera, options, done) {
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
      },
      {
        name: 'myPlugin'
      }
    )

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

    let plugin = Hp(
      function(hemera, options, next) {
        hemera.decorate('test', 1)
        try {
          hemera.decorate('test', 1)
        } catch (err) {
          expect(err).to.exists()
          hemera.close(done)
        }
        next()
      },
      {
        name: 'myPlugin'
      }
    )

    hemera.use(plugin)

    hemera.ready()
  })

  it('Should throw an error when we trying to overwrite an existing prototype property / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      hemera.decorate('test', 1)

      let plugin2 = Hp(function(hemera, options, next) {
        try {
          hemera.decorate('test', 1)
        } catch (err) {
          expect(err).to.exists()
          hemera.close(done)
        }
        next()
      })

      hemera.use(plugin2)
      next()
    })

    hemera.use(plugin)

    hemera.ready()
  })

  it('Should be able to decorate the root instance', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      hemera.decorate('test', 1)
      next()
    })

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.equals(1)
      hemera.close(done)
    })
  })

  it('Should be able to decorate root instance / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      let plugin2 = Hp(function(hemera, options, next) {
        hemera.decorate('test', 1)
        next()
      })
      hemera.use(plugin2)
      next()
    })

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      expect(hemera.test).to.be.exists()
      hemera.close(done)
    })
  })

  it('Should be able to access the decorated prototype propertys inside nested plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = Hp(function(hemera, options, next) {
      hemera.decorate('test', 1)

      expect(hemera.test).to.be.equals(1)

      let plugin2 = Hp(function(hemera, options, next) {
        expect(hemera.test).to.be.equals(1)
        next()
      })

      hemera.use(plugin2)

      next()
    })

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

    let plugin = Hp(function(hemera, options, next) {
      next(new Error('test'))
    })

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

    let plugin = Hp(function(hemera, options, done) {
      done(new UnauthorizedError('test'))
    })

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

    let plugin = Hp(function(hemera, options, next) {
      hemera.decorate('test', 1)
      next()
    })

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

    let plugin = Hp(function(hemera, options, done) {
      hemera.log.info('test')
      done()
    })

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.not.exists()
      hemera.close(done)
    })
  })
})
