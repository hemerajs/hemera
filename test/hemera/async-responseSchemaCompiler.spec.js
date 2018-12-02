'use strict'

describe('Async Response Schema Compiler', function() {
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

  it('Should be able to use a schema compiler function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setResponseSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: { foo: 'bar' }
      })
      return payload => {
        expect(payload).to.be.equals({
          result: 3
        })
        return Promise.resolve(15)
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: { foo: 'bar' }
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
          expect(resp).to.be.equals(15)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to return an error from schema compiler function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setResponseSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: { foo: 'bar' }
      })
      return payload => {
        expect(payload).to.be.equals({
          result: 3
        })
        return Promise.reject(new Error('test'))
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: { foo: 'bar' }
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

  it('Should not be able to define a seperator schema compiler for a topic which is hosted by a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const rootSpy = Sinon.spy()
    const pluginSpy = Sinon.spy()

    hemera.setResponseSchemaCompiler(schema => {
      return payload => {
        rootSpy()
        return Promise.resolve(true)
      }
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.setResponseSchemaCompiler(schema => {
          return payload => {
            pluginSpy()
            return Promise.resolve(true)
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
          expect(resp).to.be.equals(true)
          expect(rootSpy.called).to.be.equals(false)
          expect(pluginSpy.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
