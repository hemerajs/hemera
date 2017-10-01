'use strict'

const EventEmitter = require('events')
const GracefulShutdown = require('../../packages/hemera-graceful-shutdown/gracefulShutdown')
const HemeraGracefulShutdown = require('../../packages/hemera-graceful-shutdown')

describe('Hemera-graceful-shutdown', function () {
  const PORT = 6243
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

  it('Should be able to use it as plugin', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraGracefulShutdown)

    hemera.ready(() => {
      hemera.close(done)
    })
  })
})

describe('GracefulShutdown', function () {
  class FakeProcess extends EventEmitter {
    exit () {}
  }
  let noOpLogger = {
    info: () => {},
    error: () => {},
    warn: () => {}
  }

  it('Should exit with 0', function (done) {
    const gs = new GracefulShutdown()
    gs.logger = noOpLogger
    gs.process = new FakeProcess()
    gs.addHandler((code, cb) => cb())
    gs.init()

    var exitStub = Sinon.stub(gs.process, 'exit')
    exitStub.withArgs(0)

    gs.shutdown()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    })
  })

  it('Should exit with 1 when err is passed', function (done) {
    const gs = new GracefulShutdown()
    gs.logger = noOpLogger
    gs.process = new FakeProcess()
    gs.addHandler((code, cb) => cb(new Error('test')))
    gs.init()

    var exitStub = Sinon.stub(gs.process, 'exit')
    exitStub.withArgs(1)

    gs.shutdown()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    })
  })

  it('Should exit on SIGINT', function (done) {
    const gs = new GracefulShutdown()
    gs.logger = noOpLogger
    gs.process = new FakeProcess()
    gs.init()

    var exitStub = Sinon.stub(gs.process, 'exit')
    exitStub.withArgs(1)

    gs.process.emit('SIGINT')

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    })
  })

  it('Should exit on SIGTERM', function (done) {
    const gs = new GracefulShutdown()
    gs.logger = noOpLogger
    gs.process = new FakeProcess()
    gs.init()

    var exitStub = Sinon.stub(gs.process, 'exit')
    exitStub.withArgs(1)

    gs.process.emit('SIGTERM')

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    })
  })

  it('Should exit after certain timeout', function (done) {
    const gs = new GracefulShutdown()
    gs.logger = noOpLogger
    gs.timeout = 10
    gs.process = new FakeProcess()

    var exitStub = Sinon.stub(gs.process, 'exit')
    exitStub.withArgs(1)

    var shutdownStub = Sinon.stub(gs, 'shutdown')

    gs.init()
    gs.process.emit('SIGTERM')

    setTimeout(() => {
      expect(shutdownStub.calledOnce).to.be.equals(true)
      expect(exitStub.calledOnce).to.be.equals(true)
      exitStub.restore()
      shutdownStub.restore()
      done()
    }, 50)
  })
})
