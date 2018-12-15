'use strict'

describe('onSend extension error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to pass a custom super error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    let plugin = function(hemera, options, done) {
      hemera.setErrorHandler((hemera, error, reply) => {
        expect(error).to.be.exists()
        expect(error.name).to.be.equals('Unauthorized')
        expect(error.message).to.be.equals('test')
        spy()
      })

      hemera.ext('onSend', function(ctx, req, res, next) {
        next(new UnauthorizedError('test'))
      })

      hemera.add(
        {
          cmd: 'add',
          topic: 'math'
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      done()
    }

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Unauthorized')
          expect(err.message).to.be.equals('test')
          expect(err.hops).to.be.exists()
          expect(err.hops.length).to.be.equals(1)
          expect(err.hops[0].service).to.be.equals('math')
          expect(err.hops[0].method).to.be.equals('a:1,b:2,cmd:add,topic:math')
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass an error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    let plugin = function(hemera, options, done) {
      hemera.setErrorHandler((hemera, error, reply) => {
        expect(error).to.be.exists()
        expect(error.name).to.be.equals('Error')
        expect(error.message).to.be.equals('test')
        spy()
      })
      hemera.ext('onSend', function(ctx, req, res, next) {
        next(new Error('test'))
      })

      hemera.add(
        {
          cmd: 'add',
          topic: 'math'
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      done()
    }

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(err.hops).to.be.exists()
          expect(err.hops.length).to.be.equals(1)
          expect(err.hops[0].service).to.be.equals('math')
          expect(err.hops[0].method).to.be.equals('a:1,b:2,cmd:add,topic:math')
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to return a rejected promise', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    let plugin = function(hemera, options, done) {
      hemera.setErrorHandler((hemera, error, reply) => {
        expect(error).to.be.exists()
        expect(error.name).to.be.equals('Error')
        expect(error.message).to.be.equals('test')
        spy()
      })
      hemera.ext('onSend', function(ctx, req, res) {
        return Promise.reject(new Error('test'))
      })

      hemera.add(
        {
          cmd: 'add',
          topic: 'math'
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      done()
    }

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass an error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    let plugin = function(hemera, options, done) {
      hemera.setErrorHandler((hemera, error, reply) => {
        expect(error).to.be.exists()
        expect(error.name).to.be.equals('Error')
        expect(error.message).to.be.equals('test')
        spy()
      })
      hemera.ext('onSend', function(ctx, req, res, next) {
        next(new Error('test'))
      })

      hemera.add(
        {
          cmd: 'add',
          topic: 'math'
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      done()
    }

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(err.hops).to.be.exists()
          expect(err.hops.length).to.be.equals(1)
          expect(err.hops[0].service).to.be.equals('math')
          expect(err.hops[0].method).to.be.equals('a:1,b:2,cmd:add,topic:math')
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not be able to send the payload in onSend because success payload was already set', function(done) {
    let ext = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onSend', function(ctx, req, res, next) {
        ext()
        res.send('foo')
        next()
      })

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
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          expect(ext.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should send the first extension error even when an error in the onSend extensions occurs', function(done) {
    let preHandlerSpy = Sinon.spy()
    let onSend = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        preHandlerSpy()
        next(new Error('test1'))
      })
      hemera.ext('onSend', function(ctx, req, res, next) {
        onSend()
        next(new Error('test2'))
      })

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
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test1')
          expect(resp).to.be.undefined()
          expect(preHandlerSpy.called).to.be.equals(true)
          expect(onSend.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should respond onSend error even when response was already set', function(done) {
    let ext = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onSend', function(ctx, req, res, next) {
        ext()
        next(new Error('test'))
      })

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
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(resp).to.be.undefined()
          expect(ext.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
