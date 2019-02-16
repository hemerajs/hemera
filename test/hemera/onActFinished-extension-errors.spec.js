'use strict'

describe('onActFinished extension error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to pass a super error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onActFinished', function(ctx, next) {
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
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to pass an error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onActFinished', function(ctx, next) {
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
          hemera.close(done)
        }
      )
    })
  })
})
