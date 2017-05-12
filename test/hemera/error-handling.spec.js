describe('Error handling', function () {
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

  it('Should return all hemera error objects', function (done) {
    expect(Hemera.errors.HemeraError).to.be.exists()
    expect(Hemera.errors.ParseError).to.be.exists()
    expect(Hemera.errors.TimeoutError).to.be.exists()
    expect(Hemera.errors.ImplementationError).to.be.exists()
    expect(Hemera.errors.BusinessError).to.be.exists()
    expect(Hemera.errors.FatalError).to.be.exists()
    expect(Hemera.errors.PatternNotFound).to.be.exists()
    expect(Hemera.errors.PayloadValidationError).to.be.exists()
    done()
  })

  it('Should be able pass a custom super error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        const err = new UnauthorizedError('Unauthorized action')
        err.code = 444
        cb(err)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.cause.name).to.be.equals('Unauthorized')
        expect(err.cause.message).to.be.equals('Unauthorized action')
        expect(err.cause.code).to.be.equals(444)
        expect(err.cause instanceof UnauthorizedError).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to serialize and deserialize an error back to the callee', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(new Error('Uups'))
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Uups')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to transfer the error code', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        const a = new Error('Uups')
        a.code = 444
        a.test = 'hallo'
        cb(a)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Uups')
        expect(err.cause.code).to.be.equals(444)
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to transfer additional error data', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        const a = new Error('Uups')
        a.code = 444
        a.test = 'hallo'
        cb(a)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.cause.test).to.be.equals('hallo')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Uups')
        expect(err.cause.code).to.be.equals(444)
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle parsing errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera._decoder, 'decode')

    stub.returns({
      error: new Error('TEST')
    })

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
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraParseError')
        expect(err.message).to.be.equals('Invalid payload')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('TEST')

        stub.restore()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle response parsing error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      var stub = Sinon.stub(hemera._decoder, 'decode')

      stub.onCall(1)

      stub.returns({
        error: new Error('TEST')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraParseError')
        expect(err.message).to.be.equals('Invalid payload')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('TEST')

        stub.restore()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('ImplementationError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Shit!')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should crash on fatal', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: true,
      timeout: 10000
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 20)
      })
    })
  })

  it('Should crash when an unexpected error thrown during timeout issue', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 500)

        throw (new Error('Test'))
      })
    })
  })

  it('Should crash on unhandled business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('ImplementationError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Shit!')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Pattern not found', function (done) {
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
        test: 'senddedede'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('PatternNotFound')
        expect(err.message).to.be.equals('No handler found for this pattern')
        hemera.close()
        done()
      })
    })
  })

  it('Should crash when an expected error happens in the ACT handler', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: true,
      timeout: 10000
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(new Error('test'))
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 50)

        throw (new Error('Test'))
      })
    })
  })

  it('Error propagation', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        cb(new Error('B Error'))
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        // In a chain of nested wrapped errors, the original unwrapped cause can be accessed through the rootCause property of each SuperError instance in the chain.
        expect(err.rootCause.name).to.be.equals('Error')
        expect(err.rootCause.message).to.be.equals('B Error')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.pattern.topic).to.be.exists('b')
        expect(err.app).to.be.exists()

        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('B Error')

        hemera.close()
        done()
      })
    })
  })

  it('Error propagation with super errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        const a = new UnauthorizedError('test')
        a.test = 444
        cb(a)
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        // In a chain of nested wrapped errors, the original unwrapped cause can be accessed through the rootCause property of each SuperError instance in the chain.
        expect(err.rootCause.name).to.be.equals('Unauthorized')
        expect(err.rootCause.message).to.be.equals('test')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')

        expect(err.cause.name).to.be.equals('Unauthorized')
        expect(err.cause.message).to.be.equals('test')
        expect(err.cause.test).to.be.equals(444)

        hemera.close()
        done()
      })
    })
  })
})