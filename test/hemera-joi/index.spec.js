'use strict'

const HemeraJoi = require('../../packages/hemera-joi')

describe('Hemera-joi request validation', function() {
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
          expect(err.message).to.be.equals('child "a" fails because ["a" must be a number]')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to use preJoi$ to define validator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          preJoi$: {
            a: Joi.number().required()
          }
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
          expect(err.message).to.be.equals('child "a" fails because ["a" must be a number]')
          hemera.close(done)
        }
      )
    })
  })

  it('Should ignore actions without schema', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(null, true)
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          a: 'string'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
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
          expect(err.message).to.be.equals('child "a" fails because ["a" must be a number]')
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
          expect(err.message).to.be.equals('child "c" fails because ["c" is required]')
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

describe('Hemera-joi response validation', function() {
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

  it('Should be able to use joi as response validator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          postJoi$: Joi.number().required()
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
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          postJoi$: Joi.number().required()
        },
        (req, cb) => {
          cb(null, 'string')
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
          expect(err.name).to.be.equals('ValidationError')
          expect(err.message).to.be.equals('"value" must be a number')
          expect(err.details).to.be.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should strip unknown properties', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          postJoi$: Joi.object().keys({
            result: Joi.number().required()
          })
        },
        (req, cb) => {
          cb(null, {
            result: req.a + req.b,
            test: 1
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
          expect(err).to.be.not.exists()
          expect(resp.result).to.be.equals(3)
          expect(resp.test).to.be.not.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should manipulate response payload', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          postJoi$: Joi.number().required()
        },
        (req, cb) => {
          cb(null, '11')
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
          expect(resp).to.be.equals(11)
          hemera.close(done)
        }
      )
    })
  })

  it('Should skip post validation when pattern could not be found', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (req, cb) => {
          cb(null, req.a + req.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'sub',
          a: 2,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('PatternNotFound')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to use basePreSchema to support unknown: false mode', function(done) {
    const nats = require('nats').connect(authUrl)
    const Joi = require('@hapi/joi')

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi, {
      basePreSchema: {
        topic: Joi.string().required(),
        cmd: Joi.string().required()
      },
      pre: { allowUnknown: false }
    })

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
          a: 1
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to use basePostSchema standalone', function(done) {
    const nats = require('nats').connect(authUrl)
    const Joi = require('@hapi/joi')

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi, {
      basePostSchema: {
        userId: Joi.number().required()
      }
    })

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          a: Joi.number().required()
        },
        (resp, cb) => {
          cb(null, {
            userId: null
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
          expect(err.message).to.be.equals('child "userId" fails because ["userId" must be a number]')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to use basePostSchema with post$', function(done) {
    const nats = require('nats').connect(authUrl)
    const Joi = require('@hapi/joi')

    const hemera = new Hemera(nats)
    hemera.use(HemeraJoi, {
      basePostSchema: {
        userId: Joi.number().required()
      }
    })

    hemera.ready(() => {
      let Joi = hemera.joi
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          post$: {},
          a: Joi.number().required()
        },
        (resp, cb) => {
          cb(null, {
            userId: null
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
          expect(err.message).to.be.equals('child "userId" fails because ["userId" must be a number]')
          hemera.close(done)
        }
      )
    })
  })
})
