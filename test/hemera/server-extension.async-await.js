/* eslint node/no-unsupported-features: 0 */
'use strict'

describe('Server Extension Async / Await', function() {
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

  it('Should be able to reply an error in preHandler', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', async function(ctx, req, res) {
        ext1()
        res.send(new Error('test'))
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
          cmd: 'send'
        },
        (err, resp) => {
          expect(ext1.called).to.be.equals(true)
          expect(err).to.be.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should not handle an error as rejected promise in preHandler', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('preHandler', async function(ctx, req, res) {
        ext1()
        return new Error('test')
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
          expect(ext1.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reply an error in onRequest', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onRequest', async function(ctx, req, res) {
        ext1()
        res.send(new Error('test'))
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
          cmd: 'send'
        },
        (err, resp) => {
          expect(ext1.called).to.be.equals(true)
          expect(err).to.be.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should not handle an error as rejected promise in onRequest', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onRequest', async function(ctx, req, res) {
        ext1()
        return new Error('test')
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
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(ext1.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not handle an error as rejected promise in onSend', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onSend', async function(ctx, req, res) {
        ext1()
        return new Error('test')
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
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(ext1.called).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
