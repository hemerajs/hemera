'use strict'

describe('onError extension error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should abort the middleware but not overwrite the response error', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let firstOnErrorSpy = Sinon.spy()
    let secondOnErrorSpy = Sinon.spy()

    hemera.ext('onError', (hemera, payload, error, next) => {
      expect(error).to.be.an.instanceof(Error)
      firstOnErrorSpy()
      next(new Error('from hook'))
    })
    hemera.ext('onError', (hemera, payload, error, next) => {
      secondOnErrorSpy()
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Error('test'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.message).to.be.equals('test')
          expect(firstOnErrorSpy.calledOnce).to.be.equals(true)
          expect(secondOnErrorSpy.called).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })
})
