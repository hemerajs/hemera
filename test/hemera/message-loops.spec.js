'use strict'

describe('Message loop detection', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should not return an MaxRecursionError', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'silent', maxRecursion: 3 })
    let n = 0
    let max = 2

    // 1 + 2  outbounds, 1 + 2  inbounds

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          })

          cb()
          n++
        } else {
          setTimeout(() => {
            hemera.close(done)
          }, 100)
          cb()
        }
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      })
    })
  })

  it('Should return an MaxRecursionError', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'silent', maxRecursion: 2 })
    let n = 0
    let max = 2

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err instanceof Hemera.errors.MaxRecursionError) {
              expect(err.count).to.be.equals(2)
              // give nats chance to proceed the messages
              setTimeout(() => {
                hemera.close(done)
              }, 50)
            }
            cb()
            n++
          })
        }
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      })
    })
  })

  it('Should return an MaxRecursionError even on different instances', function (done) {
    const nats = require('nats').connect(authUrl)

    const maxRecursion = 10
    const hemera = new Hemera(nats, { logLevel: 'silent', maxRecursion: maxRecursion })
    const hemera2 = new Hemera(nats, { logLevel: 'silent', maxRecursion: maxRecursion })
    let n = 0
    let max = 25

    let client1Spy = Sinon.spy()
    let client2Spy = Sinon.spy()

    let client1SpyError = Sinon.spy()
    let client2SpyError = Sinon.spy()

    let recursionError = null

    hemera2.ready(() => {
      hemera2.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err) {
              client1SpyError()
              recursionError = err
            }
            client1Spy()
            cb()
            n++
          })
        }
      })
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err) {
              client2SpyError()
              recursionError = err
            }
            client2Spy()
            cb()
            n++
          })
        }
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      })
    })

    setTimeout(() => {
      expect(client1SpyError.callCount + client2SpyError.callCount).to.be.equals(1)
      expect(recursionError instanceof Hemera.errors.MaxRecursionError).to.be.equals(true)
      expect(recursionError.count).to.be.equals(maxRecursion)
      expect(client1Spy.callCount + client2Spy.callCount).to.be.equals(maxRecursion)
      hemera.close(done)
    }, 500)
  })

  it('Should return an MaxRecursionError even on different instances - with error propagation', function (done) {
    const nats = require('nats').connect(authUrl)

    const maxRecursion = 10
    const hemera = new Hemera(nats, { logLevel: 'silent', maxRecursion: maxRecursion })
    const hemera2 = new Hemera(nats, { logLevel: 'silent', maxRecursion: maxRecursion })
    let n = 0
    let max = 11

    let client1Spy = Sinon.spy()
    let client2Spy = Sinon.spy()

    let client1SpyError = Sinon.spy()
    let client2SpyError = Sinon.spy()

    let recursionError = null

    hemera2.ready(() => {
      hemera2.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err) {
              client1SpyError()
              recursionError = err
              n++
              return cb(err)
            }
            client1Spy()
            cb()
            n++
          })
        }
      })
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        if (n < max) {
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err) {
              client2SpyError()
              recursionError = err
              n++
              return cb(err)
            }
            client2Spy()
            cb()
            n++
          })
        }
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, function (err) {
        expect(err instanceof Hemera.errors.MaxRecursionError).to.be.equals(true)
        expect(err.hops.length).to.be.equals(10)
        expect(recursionError.count).to.be.equals(maxRecursion)
      })
    })

    setTimeout(() => {
      expect(client1SpyError.callCount + client2SpyError.callCount).to.be.equals(10)
      expect(recursionError instanceof Hemera.errors.MaxRecursionError).to.be.equals(true)
      expect(recursionError.count).to.be.equals(maxRecursion)
      expect(client1Spy.callCount + client2Spy.callCount).to.be.equals(0)
      hemera.close(done)
    }, 500)
  })

  it('Should be able to call after an MaxRecursionError', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'silent', maxRecursion: 2 })
    let n = 0
    let max = 2

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        // other code path
        if (resp.a) {
          cb(null, true)
        } else if (n < max) { // code path with recursion
          this.act({
            topic: 'a',
            cmd: 'a'
          }, function (err) {
            if (err instanceof Hemera.errors.MaxRecursionError) {
              expect(err.count).to.be.equals(2)
              expect(this.meta$.referrers).to.be.not.exists()
              n = 0
              this.act({
                topic: 'a',
                cmd: 'a',
                a: true
              }, (err, resp) => {
                expect(err).to.be.not.exists()
                expect(resp).to.be.equals(true)
                // give nats chance to proceed the messages
                setTimeout(() => {
                  hemera.close(done)
                }, 50)
              })
            }
            cb()
            n++
          })
        } else {
          cb()
        }
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      })
    })
  })
})
