'use strict'

describe('Circuit breaker', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to call without error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err) => {
        expect(err).to.be.not.exists()
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, (err) => {
          expect(err).to.be.not.exists()
          hemera.close()
          done()
        })
      })
    })
  })

  it('Should return error because circuit breaker is OPEN', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    let stateOpenEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(new Error('test'))
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          }, (err) => {
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            hemera.close()
            done()
          })
        })
      })
    })
  })

  it('Should auto close the circuit breaker after certain amount of time', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100,
        resetIntervalTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        if (resp.error) {
          cb(new Error('test'))
        } else {
          cb()
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(stateOpenEvent.calledOnce).to.be.equals(true)
          setTimeout(() => {
            hemera.act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2,
              error: false
            }, (err) => {
              expect(err).to.be.not.exists()
              hemera.close()
              done()
            })
          }, 300)
        })
      })
    })
  })

  it('Should able to subscribe on all circuit breaker events from all server methods', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })
    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(new Error('test'))
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      hemera.on('circuit-breaker.stateChange', (event) => {
        expect(event).to.be.equals({
          state: cb.CIRCUIT_CLOSE,
          failures: 0,
          successes: 0
        })
        hemera.close()
        done()
      })

      cb.emit('stateChange', cb.toJSON())
    })
  })

  it('Should be able to close the circuit breaker when the next call is successfully', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()
    let stateHalfOpenEvent = Sinon.spy()
    let stateCloseEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        if (resp.error) {
          cb(new Error('test'))
        } else {
          cb()
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        } else if (event.state === 'half_open') {
          stateHalfOpenEvent()
        } else if (event.state === 'close') {
          stateCloseEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            error: true
          }, (err) => {
            expect(err).to.be.exists()
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            // wait until half open timer is finished
            setTimeout(() => {
              hemera.act({
                topic: 'math',
                cmd: 'add',
                a: 1,
                b: 2,
                error: false
              }, (err) => {
                expect(err).to.be.not.exists()
                expect(stateHalfOpenEvent.calledOnce).to.be.equals(true)
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: false
                }, (err) => {
                  expect(err).to.be.not.exists()
                  expect(stateCloseEvent.calledOnce).to.be.equals(true)
                  hemera.close()
                  done()
                })
              })
            }, 150)
          })
        })
      })
    })
  })

  it('Should be able to open the circuit breaker after an error in halp open state', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()
    let stateHalfOpenEvent = Sinon.spy()
    let stateCloseEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        if (resp.error) {
          cb(new Error('test'))
        } else {
          cb()
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        } else if (event.state === 'half_open') {
          stateHalfOpenEvent()
        } else if (event.state === 'close') {
          stateCloseEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            error: true
          }, (err) => {
            expect(err).to.be.exists()
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            // wait until half open timer is finished
            setTimeout(() => {
              hemera.act({
                topic: 'math',
                cmd: 'add',
                a: 1,
                b: 2,
                error: false
              }, (err) => {
                expect(err).to.be.not.exists()
                expect(stateHalfOpenEvent.calledOnce).to.be.equals(true)
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: true
                }, (err) => {
                  // return business error instead circuit breaker
                  expect(err).to.be.exists()
                  expect(stateOpenEvent.calledTwice).to.be.equals(true)
                  hemera.close()
                  done()
                })
              })
            }, 150)
          })
        })
      })
    })
  })
})

describe('Circuit breaker with Generators / Promises', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to call without error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      generators: true,
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        return { a: 1 }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err) => {
        expect(err).to.be.not.exists()
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, (err) => {
          expect(err).to.be.not.exists()
          hemera.close()
          done()
        })
      })
    })
  })

  it('Should return error because circuit breaker is OPEN', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      generators: true,
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    let stateOpenEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        return Promise.reject(new Error('test'))
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          }, (err) => {
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            hemera.close()
            done()
          })
        })
      })
    })
  })

  it('Should auto close the circuit breaker after certain amount of time', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      generators: true,
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100,
        resetIntervalTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          expect(stateOpenEvent.calledOnce).to.be.equals(true)
          setTimeout(() => {
            hemera.act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2,
              error: false
            }, (err) => {
              expect(err).to.be.not.exists()
              hemera.close()
              done()
            })
          }, 300)
        })
      })
    })
  })

  it('Should be able to close the circuit breaker when the next call is successfully', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      generators: true,
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()
    let stateHalfOpenEvent = Sinon.spy()
    let stateCloseEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        } else if (event.state === 'half_open') {
          stateHalfOpenEvent()
        } else if (event.state === 'close') {
          stateCloseEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            error: true
          }, (err) => {
            expect(err).to.be.exists()
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            // wait until half open timer is finished
            setTimeout(() => {
              hemera.act({
                topic: 'math',
                cmd: 'add',
                a: 1,
                b: 2,
                error: false
              }, (err) => {
                expect(err).to.be.not.exists()
                expect(stateHalfOpenEvent.calledOnce).to.be.equals(true)
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: false
                }, (err) => {
                  expect(err).to.be.not.exists()
                  expect(stateCloseEvent.calledOnce).to.be.equals(true)
                  hemera.close()
                  done()
                })
              })
            }, 150)
          })
        })
      })
    })
  })

  it('Should be able to open the circuit breaker after an error in halp open state', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      generators: true,
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let stateOpenEvent = Sinon.spy()
    let stateHalfOpenEvent = Sinon.spy()
    let stateCloseEvent = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
        }
      })

      const cb = hemera.router.lookup({
        cmd: 'add',
        topic: 'math'
      }).actMeta.circuitBreaker

      cb.on('stateChange', (event) => {
        if (event.state === 'open') {
          stateOpenEvent()
        } else if (event.state === 'half_open') {
          stateHalfOpenEvent()
        } else if (event.state === 'close') {
          stateCloseEvent()
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        error: true
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          error: true
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            error: true
          }, (err) => {
            expect(err).to.be.exists()
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(stateOpenEvent.calledOnce).to.be.equals(true)
            // wait until half open timer is finished
            setTimeout(() => {
              hemera.act({
                topic: 'math',
                cmd: 'add',
                a: 1,
                b: 2,
                error: false
              }, (err) => {
                expect(err).to.be.not.exists()
                expect(stateHalfOpenEvent.calledOnce).to.be.equals(true)
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: true
                }, (err) => {
                  // return business error instead circuit breaker
                  expect(err).to.be.exists()
                  expect(stateOpenEvent.calledTwice).to.be.equals(true)
                  hemera.close()
                  done()
                })
              })
            }, 150)
          })
        })
      })
    })
  })
})
