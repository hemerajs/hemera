'use strict'

describe('Response Schema Compiler', function() {
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

    hemera.setResponseSchemaCompiler(schema => {
      expect(schema).to.be.a.equals({
        a: { foo: 'bar' }
      })
      return payload => {
        expect(payload).to.be.equals({
          result: 3
        })
        return {
          value: 15
        }
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
        return {
          error: new Error('test')
        }
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
})
