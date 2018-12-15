'use strict'

describe('Schema Compiler', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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

  it('SchemaCompiler must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setSchemaCompiler(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals(
          'SchemaCompiler handler must be a function'
        )
        hemera.close(done)
      }
    })
  })

  it('ResponseSchemaCompiler must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setResponseSchemaCompiler(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals(
          'ResponseSchemaCompiler handler must be a function'
        )
        hemera.close(done)
      }
    })
  })
})
