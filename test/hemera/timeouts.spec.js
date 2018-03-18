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

  it('Should not receive more messages when multiple participants timeouts', function(done) {
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

  it('Should receive timeout when expected count of messages could not be received', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let error = 0
    let result = 0

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'test',
          cmd: 'A'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'test',
          cmd: 'A',
          timeout$: 100,
          expectedMessages$: 2
        },
        function(err, resp) {
          if (err) {
            error++
          } else {
            result++
          }
        }
      )

      setTimeout(() => {
        expect(error).to.be.equals(1)
        expect(result).to.be.equals(1)
        hemera.close(done)
      }, 300)
    })
  })

  it('Should not timeout when more messages than expected are send because the INBOX is closed automatically', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let error = 0
    let result = 0

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'test',
          cmd: 'A'
        },
        function(resp, reply) {
          for (let i = 0; i < 10; i++) {
            this.reply.next(i)
          }
        }
      )

      hemera.act(
        {
          topic: 'test',
          cmd: 'A',
          expectedMessages$: 5
        },
        function(err, resp) {
          if (err) {
            error++
          } else {
            result++
          }
        }
      )

      setTimeout(() => {
        expect(error).to.be.equals(0)
        expect(result).to.be.equals(5)
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
