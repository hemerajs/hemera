'use strict'

describe('Async Schema Compiler', function() {
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

  it('Should be able to modify request pattern with fulfilled promise value', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: {}
      })
      return pattern => {
        expect(pattern).to.be.equals({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        })
        return Promise.resolve({
          a: 5,
          b: 10
        })
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: {}
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(15)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to rejecte the request with reject promise', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: {}
      })
      return pattern => {
        return Promise.reject(new Error('test'))
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: {}
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should return a timeout error when schema compiler takes too long', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.setSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: {}
      })
      return pattern => {
        return new Promise((resolve, reject) => {
          setTimeout(() => resolve(), 200)
        })
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: {}
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          // give the promise the chance to respond within active nats connection
          // otherwise we will run into a connection error
          setTimeout(() => {
            hemera.close(done)
          }, 200)
        }
      )
    })
  })

  it('Should not be able to define a seperator schema compiler for a topic which is hosted by a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const rootSpy = Sinon.spy()
    const pluginSpy = Sinon.spy()

    hemera.setSchemaCompiler(schema => {
      return payload => {
        rootSpy()
        return Promise.resolve()
      }
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.setSchemaCompiler(schema => {
          return payload => {
            pluginSpy()
            return Promise.resolve()
          }
        })
        hemera.add(
          {
            topic: 'math',
            cmd: 'add'
          },
          (resp, cb) => {
            cb()
          }
        )

        done()
      },
      {
        name: 'myPlugin'
      }
    )

    hemera.use(myPlugin)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'sub'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'sub'
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp).to.be.equals()
          expect(rootSpy.called).to.be.equals(false)
          expect(pluginSpy.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
