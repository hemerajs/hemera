/* eslint node/no-unsupported-features: 0 */
'use strict'

describe('Client Extension Async / Await', function() {
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

  it('Should not handle an error as rejected promise in onAct', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onAct', async function(ctx) {
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

  it('Should not handle an error as rejected promise in onAct', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onAct', async function(ctx) {
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

  it('Should not handle an error as rejected promise in onActFinished', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onActFinished', async function(ctx) {
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

  it('Should not handle an error as rejected promise in onActFinished', function(done) {
    let ext1 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onActFinished', async function(ctx) {
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
