
describe('GracefulShutdown', function () {
  let noOpLogger = {
    info: () => {},
    error: () => {}
  }

  it('Should exit with 0', function (done) {
    const be = new GracefulShutdown(noOpLogger)
    be.addHandler((code, cb) => cb())
    be.init()

    var exitStub = Sinon.stub(process, 'exit')
    exitStub.withArgs(0).returns(true)

    be.shutdown()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    }, 30)
  })

  it('Should exit with 1 when exit handler return rejected promise', function (done) {
    const be = new GracefulShutdown(noOpLogger)
    be.addHandler((code, cb) => cb(new Error('test')))
    be.init()

    var exitStub = Sinon.stub(process, 'exit')
    exitStub.withArgs(1).returns(true)

    be.shutdown()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    }, 30)
  })
})
