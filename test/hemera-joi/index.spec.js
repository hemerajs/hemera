'use strict'

const HemeraJoi = require('../../packages/hemera-joi')

describe('Hemera-joi', function() {
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

  it('Should be able to use joi as payload validator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          a: Joi.number().required()
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 'string'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('ValidationError')
          expect(err.details).to.be.exists()
          expect(err.message).to.be.equals(
            'child "a" fails because ["a" must be a number]'
          )
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able modify payload by custom payload validator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          a: Joi.number().required(),
          b: Joi.number().default(100)
        },
        (resp, cb) => {
          expect(resp.b).to.be.equals(100)
          cb(null, true)
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 33
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)

          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass the full joi schema to the action', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          joi$: Joi.object().keys({
            a: Joi.number().required()
          })
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 'dwedwed'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('ValidationError')
          expect(err.details).to.be.exists()
          expect(err.message).to.be.equals(
            'child "a" fails because ["a" must be a number]'
          )
          hemera.close(done)
        }
      )
    })
  })

  it('Should validate request payload', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          joi$: {
            c: Joi.number().required()
          }
        },
        (resp, cb) => {
          cb(null, {
            a: 1
          })
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 1
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('ValidationError')
          expect(err.details).to.be.exists()
          expect(err.message).to.be.equals(
            'child "c" fails because ["c" is required]'
          )
          hemera.close(done)
        }
      )
    })
  })

  it('Should validate and manipulate request payload', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          joi$: {
            c: Joi.number().default(100)
          }
        },
        (resp, cb) => {
          expect(resp.c).to.be.equals(100)
          cb(null, {
            a: 1
          })
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 1
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should expose joi library', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraJoi)

    hemera.ready(() => {
      expect(hemera.joi).to.be.exists()
      hemera.close(done)
    })
  })
})
