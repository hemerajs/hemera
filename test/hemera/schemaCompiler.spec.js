'use strict'

describe('Schema Compiler', function() {
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
        return {
          value: {
            a: 5,
            b: 10
          },
          error: null
        }
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

  it('Should be able to return an error from schema compiler function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: {}
      })
      return pattern => {
        return {
          value: null,
          error: new Error('test')
        }
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
})
