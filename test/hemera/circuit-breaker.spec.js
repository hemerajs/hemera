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

  it('Should open the circuit breaker on timeout issues', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        timeout$: 50
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          timeout$: 50
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            timeout$: 50
          }, (err) => {
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,topic:math')
            hemera.close()
            done()
          })
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

    let addActionCalled = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        addActionCalled()
        cb(new Error('test'))
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
            expect(addActionCalled.callCount).to.be.equals(2)
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,topic:math')
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

    let addActionCalled = Sinon.spy()

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
        addActionCalled()
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
          setTimeout(() => {
            hemera.act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2,
              error: false
            }, (err) => {
              expect(err).to.be.not.exists()
              expect(addActionCalled.callCount).to.be.equals(3)
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
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let addActionCalled = Sinon.spy()

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
        addActionCalled()
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
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,error:true,topic:math')
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
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: false
                }, (err) => {
                  expect(err).to.be.not.exists()
                  expect(addActionCalled.callCount).to.be.equals(4)
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

    let addActionCalled = Sinon.spy()

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
        addActionCalled()
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
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,error:true,topic:math')
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
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: true
                }, (err) => {
                  // return business error instead circuit breaker
                  expect(err).to.be.exists()
                  expect(addActionCalled.callCount).to.be.equals(4)
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

  it('Should be able to call in HALF OPEN state', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      circuitBreaker: {
        enabled: true,
        maxFailures: 1,
        halfOpenTime: 100,
        minSuccesses: 1
      }
    })

    let addActionCallCount = 0

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        addActionCallCount += 1
        if (addActionCallCount < 2) {
          cb(new Error('test'))
        } else {
          cb(null, true)
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
          expect(err.name).to.be.equals('CircuitBreakerError')
          expect(err.message).to.be.equals('Circuit breaker is open')
          expect(err.service).to.be.equals('math')
          expect(err.method).to.be.equals('a:1,b:2,cmd:add,topic:math')
            // wait until half open timer is finished
          setTimeout(() => {
            hemera.act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2
            }, (err, resp) => {
              expect(err).to.be.not.exists()
              expect(resp).to.be.equals(true)
              hemera.close()
              done()
            })
          }, 150)
        })
      })
    })
  })
})

describe('Circuit breaker - Generator / Promise support', function () {
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
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp) {
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

  it('Should open the circuit breaker on timeout issues', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      circuitBreaker: {
        enabled: true,
        maxFailures: 2
      }
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        timeout$: 50
      }, (err) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          timeout$: 50
        }, (err) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2,
            timeout$: 50
          }, (err) => {
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,topic:math')
            hemera.close()
            done()
          })
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

    let addActionCalled = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp) {
        addActionCalled()
        return Promise.reject(new Error('test'))
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
            expect(addActionCalled.callCount).to.be.equals(2)
            expect(err.name).to.be.equals('CircuitBreakerError')
            expect(err.message).to.be.equals('Circuit breaker is open')
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,topic:math')
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

    let addActionCalled = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        addActionCalled()
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
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
          setTimeout(() => {
            hemera.act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2,
              error: false
            }, (err) => {
              expect(err).to.be.not.exists()
              expect(addActionCalled.callCount).to.be.equals(3)
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
      circuitBreaker: {
        enabled: true,
        maxFailures: 2,
        halfOpenTime: 100
      }
    })

    let addActionCalled = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        addActionCalled()
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
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
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,error:true,topic:math')
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
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: false
                }, (err) => {
                  expect(err).to.be.not.exists()
                  expect(addActionCalled.callCount).to.be.equals(4)
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

    let addActionCalled = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, function * (resp, cb) {
        addActionCalled()
        if (resp.error) {
          return Promise.reject(new Error('test'))
        } else {
          return Promise.resolve({ a: 1 })
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
            expect(err.service).to.be.equals('math')
            expect(err.method).to.be.equals('a:1,b:2,cmd:add,error:true,topic:math')
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
                hemera.act({
                  topic: 'math',
                  cmd: 'add',
                  a: 1,
                  b: 2,
                  error: true
                }, (err) => {
                  // return business error instead circuit breaker
                  expect(err).to.be.exists()
                  expect(addActionCalled.callCount).to.be.equals(4)
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
