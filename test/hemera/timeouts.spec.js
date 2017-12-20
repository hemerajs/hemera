'use strict'

describe('Timeouts', function() {
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

  it('Should not receive more messages when the INBOX timeouts', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let aError = 0
    let bError = 0
    let aResult = 0
    let bResult = 0

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'test',
          cmd: 'A'
        },
        (resp, cb) => {
          setTimeout(() => {
            cb(null, {
              ok: true
            })
          }, 250)
        }
      )

      hemera.add(
        {
          topic: 'test',
          cmd: 'B'
        },
        function(resp, cb) {
          this.act(
            {
              topic: 'test',
              cmd: 'A',
              timeout$: 100
            },
            function(err, res) {
              if (err) {
                aError++
                cb(err)
              } else {
                aResult++
                cb(null, res)
              }
            }
          )
        }
      )

      hemera.act(
        {
          topic: 'test',
          cmd: 'B',
          timeout$: 150
        },
        function(err, resp) {
          if (err) {
            bError++
          } else {
            bResult++
          }
        }
      )

      setTimeout(() => {
        expect(aError).to.be.equals(1)
        expect(aResult).to.be.equals(0)
        expect(bError).to.be.equals(1)
        expect(bResult).to.be.equals(0)
        hemera.close(done)
      }, 300)
    })
  })

  it('Should not receive more messages with maxMessages$ set when the INBOX timeouts', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let aError = 0
    let bError = 0
    let aResult = 0
    let bResult = 0

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'test',
          cmd: 'A'
        },
        (resp, cb) => {
          setTimeout(() => {
            cb(null, {
              ok: true
            })
          }, 250)
        }
      )

      hemera.add(
        {
          topic: 'test',
          cmd: 'B'
        },
        function(resp, cb) {
          this.act(
            {
              topic: 'test',
              cmd: 'A',
              timeout$: 100
            },
            function(err, res) {
              if (err) {
                aError++
                cb(err)
              } else {
                aResult++
                cb(null, res)
              }
            }
          )
        }
      )

      hemera.act(
        {
          topic: 'test',
          cmd: 'B',
          timeout$: 150,
          maxMessages$: 10
        },
        function(err, resp) {
          if (err) {
            bError++
          } else {
            bResult++
          }
        }
      )

      setTimeout(() => {
        expect(aError).to.be.equals(1)
        expect(aResult).to.be.equals(0)
        expect(bError).to.be.equals(1)
        expect(bResult).to.be.equals(0)
        hemera.close(done)
      }, 300)
    })
  })
})

describe('Timeouts', function() {
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

  it('Should throw timeout error when callback is not fired', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {}
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          setTimeout(() => {
            expect(err).to.be.exists()
            expect(resp).not.to.be.exists()
            expect(err.name).to.be.equals('TimeoutError')
            expect(err.message).to.be.equals('Timeout')
            hemera.close(done)
          }, 200)
        }
      )
    })
  })

  it('Should be able listen on client timeout events in onClientPostRequest', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    let event = Sinon.spy()

    hemera.ready(() => {
      hemera.on('clientPostRequest', function(ctx) {
        const err = ctx._response.error

        expect(err).to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')

        event()
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {}
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
          expect(event.called).to.be.equals(true)
          expect(resp).not.to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(err.message).to.be.equals('Timeout')
          hemera.close(done)
        }
      )
    })
  })

  it('Should crash when an unexpected error thrown during timeout issue', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          // Fatal Error will be throw after the server proceed the msg
          setTimeout(() => {
            expect(stub.called).to.be.equals(true)
            stub.restore()
            hemera.close(done)
          }, 500)

          throw new Error('Test')
        }
      )
    })
  })

  it('Should crash when an unexpected super error thrown during timeout issue', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          // Fatal Error will be throw after the server proceed the msg
          setTimeout(() => {
            expect(stub.called).to.be.equals(true)
            stub.restore()
            hemera.close(done)
          }, 500)

          throw new UnauthorizedError('test')
        }
      )
    })
  })

  it('Should be able handle super error in extension onClientPostRequest', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.ready(() => {
      hemera.ext('onClientPostRequest', function(ctx, next) {
        next(new UnauthorizedError('test'))
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {}
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
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able handle error in extension onClientPostRequest', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.ready(() => {
      hemera.ext('onClientPostRequest', function(ctx, next) {
        next(new Error('test'))
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {}
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
          hemera.close(done)
        }
      )
    })
  })

  it('Should throw timeout error when pattern is not defined on the network', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

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
          expect(resp).not.to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(err.message).to.be.equals('Timeout')
          hemera.close(done)
        }
      )
    })
  })
})
