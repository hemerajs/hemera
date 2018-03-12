'use strict'

describe('Middleware', function() {
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

  it('Should be able to define server method with chaining syntax', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          next()
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to return promise', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'info' })

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp) {
          return Promise.resolve('test')
        })
        .end(req => Promise.resolve(req.a + req.b))

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to define middleware for a server method with chaining syntax', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          callback()
          next()
        })
        .use(function(req, resp, next) {
          callback()
          next()
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          expect(callback.calledTwice).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass an array of middleware function for a server method', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use([
          function(req, resp, next) {
            callback()
            next()
          },
          function(req, resp, next) {
            callback()
            next()
          }
        ])
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          expect(callback.calledTwice).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reply in middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          resp.send({ a: 1 })
          next()
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.a).to.be.equals(1)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not call action when end() was called middlewares', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'info' })

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, reply, next) {
          reply.end({ a: 1 })
          next()
        })
        .end(function(req) {
          throw new Error('test')
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.a).to.be.equals(1)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reply an error in middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          resp.send(new Error('test'))
          next()
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to handle an middleware error of a server method', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          next(new Error('test'))
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass a custom super error to the middleware handler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          next(new UnauthorizedError('test'))
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Unauthorized')
          expect(err.message).to.be.equals('test')
          expect(err instanceof UnauthorizedError).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('A middleware error should abort the response with the error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(function(req, resp, next) {
          next(new Error('test'))
        })
        .use(function(req, resp, next) {
          callback()
          next()
        })
        .end(function(req, cb) {
          callback()
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(callback.calledOnce).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })
})
