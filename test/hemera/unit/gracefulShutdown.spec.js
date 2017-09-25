'use strict'

const EventEmitter = require('events')

describe('GracefulShutdown', function () {
  class FakeProcess extends EventEmitter {
    exit() {}
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
