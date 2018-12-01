'use strict'

describe('Server Extensions', function() {
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

  it('Should be able to reply an error', function(done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        res.send(new Error('test'))
        next()
      })

      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
        next()
      })

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
          expect(ext1.called).to.be.equals(true)
          expect(ext2.called).to.be.equals(true)
          expect(err).to.be.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should not be able to overwrite the previous error', function(done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        res.send(new Error('test'))
        next(new Error('test2'))
      })

      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
        next()
      })

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
          expect(ext1.called).to.be.equals(true)
          expect(ext2.called).to.be.equals(false)
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should not be able to send multiple times', function(done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        res.send({ a: 1 })
        res.send({ a: 2 })
        next()
      })

      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        res.send({ a: 3 })
        res.send({ a: 4 })
        next()
      })

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
          expect(ext1.called).to.be.equals(true)
          expect(ext2.called).to.be.equals(true)
          expect(err).to.be.not.exists()
          expect(resp.a).to.be.equals(1)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to send', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        res.send({
          msg: 'authorized'
        })
        next()
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(null, 'test')
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
          expect(resp).to.be.equals({
            msg: 'authorized'
          })
          expect(ext1.called).to.be.equals(true)
          expect(err).to.be.not.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to access request and response in server extensions', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()
    let ext3 = Sinon.spy()

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(res.error).to.be.not.exists()
        expect(res.payload).to.be.not.exists()
        expect(res.send).to.be.function()
        ext1()
        next()
      })

      hemera.ext('onRequest', function(ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(res.error).to.be.not.exists()
        expect(res.payload).to.be.not.exists()
        expect(res.send).to.be.function()
        ext2()
        next()
      })

      hemera.ext('onSend', function(ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.object()
        expect(res.error).to.be.not.exists()
        expect(res.send).to.be.function()
        ext3()
        next()
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(null, {
            foo: 'bar'
          })
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
          expect(err).to.be.not.exists()
          expect(ext1.called).to.be.equals(true)
          expect(ext2.called).to.be.equals(true)
          expect(ext3.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should pass the response to the next', function(done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext1()
        next()
      })

      hemera.ext('preHandler', function(ctx, req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
        next()
      })

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
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals({
            msg: 'authorized'
          })
          expect(ext1.called).to.be.equals(true)
          expect(ext2.called).to.be.equals(true)
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
        res.send({
          msg: 'authorized'
        })
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
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
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

  it('Should send the onRequest error instead the last extension error payload', function(done) {
    let onRequestSpy = Sinon.spy()
    let preHandlerSpy = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onRequest', function(ctx, req, res, next) {
        onRequestSpy()
        next(new Error('test1'))
      })
      hemera.ext('preHandler', function(ctx, req, res, next) {
        preHandlerSpy()
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
          expect(onRequestSpy.called).to.be.equals(true)
          expect(preHandlerSpy.called).to.be.equals(false)
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

  it('Should send the extension error in onSend instead the success payload', function(done) {
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
