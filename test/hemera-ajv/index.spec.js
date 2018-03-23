'use strict'

const HemeraAjv = require('../../packages/hemera-ajv')

describe('Hemera-ajv request validation', function() {
  const PORT = 6243
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

  it('Should return validation error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          ajv$: {
            type: 'object',
            properties: {
              a: { type: 'number' },
              b: { type: 'number' }
            }
          }
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 'dd',
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('pattern.a should be number')
          hemera.close(done)
        }
      )
    })
  })

  it('Should return payload', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          ajv$: {
            type: 'object',
            properties: {
              a: { type: 'number' },
              b: { type: 'number' }
            }
          }
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
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
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should modify payload', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          ajv$: {
            type: 'object',
            properties: {
              a: { type: 'number' },
              b: { type: 'number' }
            }
          }
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: '2'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })
})
