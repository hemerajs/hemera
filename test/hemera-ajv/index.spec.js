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

  it('Should request with no error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
          }
        },
        (req, cb) => {
          cb(null, req.a + req.b)
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

  it('Should return validation error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
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

  it('Should be able to define custom schemas for reuse with id', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.addSchema({
        $id: 'requestSchema',
        type: 'object',
        properties: {
          hello: { type: 'number' }
        }
      })

      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          schema: {
            request: 'requestSchema#'
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
          hello: 'test'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('pattern.hello should be number')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to define request schema inside request property', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          schema: {
            request: {
              type: 'object',
              properties: {
                hello: { type: 'number' }
              }
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
          hello: 'test'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('pattern.hello should be number')
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
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
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
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
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

  it('Should expose decorators', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraAjv)

    hemera.ready(() => {
      expect(hemera.addSchema).to.be.exists()
      hemera.close(done)
    })
  })
})

describe('Hemera-ajv response validation', function() {
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

  it('Should respond with no error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          schema: {
            response: {
              type: 'number'
            }
          }
        },
        (resp, cb) => {
          cb(null, 400)
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
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(400)
          hemera.close(done)
        }
      )
    })
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
          schema: {
            response: {
              type: 'number'
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
          expect(err.message).to.be.equals('response should be number')
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
          schema: {
            response: {
              type: 'object',
              properties: {
                foo: { type: 'number' }
              }
            }
          }
        },
        (resp, cb) => {
          cb(null, {
            foo: '400'
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp.foo).to.be.equals(400)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to define custom schemas for reuse with id', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraAjv)

    hemera.ready(() => {
      hemera.addSchema({
        $id: 'responseSchema',
        type: 'number'
      })

      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          schema: {
            response: 'responseSchema#'
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
          hello: 'test'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('response should be number')
          hemera.close(done)
        }
      )
    })
  })
})
