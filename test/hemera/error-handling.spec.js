'use strict'

describe('Error handling', function () {
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
        expect(err.name).to.be.equals('Unauthorized')
        expect(err.message).to.be.equals('Unauthorized action')
        expect(err.code).to.be.equals(444)
        expect(err instanceof UnauthorizedError).to.be.equals(true)
        hemera.close(done)
      })
    })
  })

  it('Should be able to compare hemera errors with instanceof', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(new Hemera.errors.BusinessError('test'))
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('test')
        expect(err instanceof Hemera.errors.BusinessError).to.be.equals(true)
        hemera.close(done)
      })
    })
  })

  it('Should be able to compare custom hemera errors with instanceof', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const FooBarError = hemera.createError('FooBarError')

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(new FooBarError('test'))
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('FooBarError')
        expect(err.message).to.be.equals('test')
        expect(err instanceof FooBarError).to.be.equals(true)
        hemera.close(done)
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
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('Uups')
        hemera.close(done)
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
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('Uups')
        expect(err.code).to.be.equals(444)
        hemera.close(done)
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
        expect(err.test).to.be.equals('hallo')
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('Uups')
        expect(err.code).to.be.equals(444)
        hemera.close(done)
      })
    })
  })

  it('Should be able to handle decoding errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera.decoder, 'run')

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
        hemera.close(done)
      })
    })
  })

  it('Should be able to handle response decoding error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      var stub = Sinon.stub(hemera.decoder, 'run')

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
        hemera.close(done)
      })
    })
  })

  it('Should be able to handle response encoding error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera.encoder, 'run')
      .onSecondCall()
      .returns({
        error: new Error('TEST')
      })

    stub.callThrough()

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
        hemera.close(done)
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
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('Shit!')
        hemera.close(done)
      })
    })
  })

  it('Should be able to handle business errors with super errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new UnauthorizedError('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Unauthorized')
        expect(err.message).to.be.equals('Shit!')
        hemera.close(done)
      })
    })
  })

  it('Should crash on fatal', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: true,
      timeout: 10000,
      logLevel: 'silent'
    })

    var stub = Sinon.stub(process, 'exit')

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
          hemera.close(done)
        }, 20)
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
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('Shit!')
        hemera.close(done)
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
        expect(err.pattern).to.be.equals('test:senddedede,topic:email')
        expect(err.app).to.be.exists()
        expect(err.isServer).to.be.equals(true)
        expect(err.message).to.be.equals('No handler found for this pattern')
        hemera.close(done)
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
          hemera.close(done)
        }, 50)

        throw (new Error('Test'))
      })
    })
  })
})
