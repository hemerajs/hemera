describe('Hemera', function () {
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

  it('Should be able to add a handler and act it', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a * resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: resp.result,
          b: 2
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(6)

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should be able to add a handler and act it with complex types', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a.number + resp.b.number
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a.number * resp.b.number
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: {
          number: 1
        },
        b: {
          number: 2
        }
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: {
            number: resp.result
          },
          b: {
            number: 2
          }
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(6)

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should be able to act without a callback', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      hemera.close()
      done()
    })
  })

  it('Should be able to define server method with chaining syntax', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next()
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to define middleware for a server method with chaining syntax', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          callback()
          next()
        })
        .use(function (req, resp, next) {
          callback()
          next()
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        expect(callback.calledTwice).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to use locals on the serverRequest object', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          const a = { a: 1 }
          req.locals.test = a
          next()
        })
        .end(function (req, cb) {
          expect(this._request.locals).to.be.equals({ test: { a: 1 } })
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to pass an array of middleware function for a server method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use([function (req, resp, next) {
          callback()
          next()
        }, function (req, resp, next) {
          callback()
          next()
        }])
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        expect(callback.calledTwice).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to get list of all patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'send'
      }, (resp, cb) => {

      })

      let result = hemera.list()

      expect(result).to.be.an.array()

      hemera.close()
      done()
    })
  })

  it('Topic is required in a add', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add({
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to subscribe')
        hemera.close()
        done()
      }
    })
  })

  it('Should throw an error by duplicate patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Pattern is already in use')
        hemera.close()
        done()
      }
    })
  })

  it('Should be able to handle an middleware error of a server method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next(new Error('test'))
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Middleware error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to pass a custom super error to the middleware handler', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next(new UnauthorizedError('test'))
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Middleware error')
        expect(err.cause.name).to.be.equals('Unauthorized')
        expect(err.cause.message).to.be.equals('test')
        expect(err.cause instanceof UnauthorizedError).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('A middleware error should abort the response with the error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next(new Error('test'))
        })
        .use(function (req, resp, next) {
          callback()
          next()
        })
        .end(function (req, cb) {
          callback()
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Middleware error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        expect(callback.calledOnce).to.be.equals(false)
        hemera.close()
        done()
      })
    })
  })

  it('Topic is required in a act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.act({
          cmd: 'send'
        }, (resp, cb) => {

        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to request')
        hemera.close()
        done()
      }
    })
  })

  it('Should be able to call a handler by different patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a - resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'sub',
          a: 2,
          b: 2
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(0)
          hemera.close()
          done()
        })
      })
    })
  })

  it('Should call server function only one time (queue groups by default)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera1 = new Hemera(nats)

    let callback = Sinon.spy()

    hemera1.ready(() => {
      hemera1.add({
        topic: 'email',
        cmd: 'send'
      }, (req, cb) => {
        cb()
        callback()
      })
    })

    const hemera2 = new Hemera(nats)

    hemera2.ready(() => {
      hemera2.add({
        topic: 'email',
        cmd: 'send'
      }, (req, cb) => {
        cb()
        callback()
      })

      setTimeout(function () {
        hemera2.act({
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(callback.calledOnce).to.be.equals(true)
          hemera1.close()
          hemera2.close()
          done()
        })
      }, 50)
    })
  })
})
