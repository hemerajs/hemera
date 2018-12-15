'use strict'

describe('Error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should return all hemera error objects', function(done) {
    expect(Hemera.errors.HemeraError).to.be.exists()
    expect(Hemera.errors.ParseError).to.be.exists()
    expect(Hemera.errors.TimeoutError).to.be.exists()
    expect(Hemera.errors.ResponseError).to.be.exists()
    expect(Hemera.errors.PatternNotFound).to.be.exists()
    done()
  })

  it('Should be able pass a custom super error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          const err = new UnauthorizedError('Unauthorized action')
          err.code = 444
          cb(err)
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Unauthorized')
          expect(err.message).to.be.equals('Unauthorized action')
          expect(err.code).to.be.equals(444)
          expect(err instanceof UnauthorizedError).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to compare hemera errors with instanceof', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Hemera.errors.ResponseError('test'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('ResponseError')
          expect(err.message).to.be.equals('test')
          expect(err instanceof Hemera.errors.ResponseError).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should respond with error when no native error object was passed in server action callback', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 25
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          // an error is logged that the interface was used incorrrectly
          // the request will timeout because the server could not indentify if it's success or error payload
          // eslint-disable-next-line standard/no-callback-literal
          cb('test')
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(resp).to.be.undefined()
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to compare custom hemera errors with instanceof', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const FooBarError = hemera.createError('FooBarError')

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new FooBarError('test'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('FooBarError')
          expect(err.message).to.be.equals('test')
          expect(err instanceof FooBarError).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to serialize and deserialize an error back to the callee', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Error('Uups'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('Uups')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to transfer the error code', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          const a = new Error('Uups')
          a.code = 444
          a.test = 'hallo'
          cb(a)
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('Uups')
          expect(err.code).to.be.equals(444)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to transfer additional error data', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          const a = new Error('Uups')
          a.code = 444
          a.test = 'hallo'
          cb(a)
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.test).to.be.equals('hallo')
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('Uups')
          expect(err.code).to.be.equals(444)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle client decoding error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.setClientDecoder(msg => {
        return {
          error: new Error('TEST')
        }
      })

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('TEST')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle server decoding error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    hemera.setErrorHandler((hemera, error, reply) => {
      expect(error).to.be.exists()
      expect(error.name).to.be.equals('Error')
      expect(error.message).to.be.equals('TEST')
      spy()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.setServerDecoder(msg => {
        return {
          error: new Error('TEST')
        }
      })

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('TEST')
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should return timeout when server produce encoding error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { timeout: 100 })

    hemera.setServerEncoder(msg => {
      return {
        error: new Error('TEST')
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(err.message).to.be.equals('Client timeout')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle client encoding error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setClientEncoder(msg => {
      return {
        error: new Error('TEST')
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('TEST')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle business errors', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        resp => {
          return Promise.reject(new Error('Shit!'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('Shit!')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle business errors with super errors', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        resp => {
          return Promise.reject(new UnauthorizedError('Shit!'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Unauthorized')
          expect(err.message).to.be.equals('Shit!')
          hemera.close(done)
        }
      )
    })
  })

  it('Pattern not found', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          test: 'senddedede'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('PatternNotFound')
          expect(err.pattern).to.be.equals('test:senddedede,topic:email')
          expect(err.app).to.be.exists()
          expect(err.isServer).to.be.equals(true)
          expect(err.message).to.be.equals('No action found for this pattern')
          hemera.close(done)
        }
      )
    })
  })
})
