
describe('BeforeExit', function () {
  it('Should exit with 0', function (done) {
    const be = new BeforeExit()
    be.addAction(() => true)
    be.init()

    var exitStub = Sinon.stub(process, 'exit')
    exitStub.withArgs(0).returns(true)

    be.doActions()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    }, 30)
  })

  it('Should exit with 1 when exit handler return rejected promise', function (done) {
    const be = new BeforeExit()
    be.addAction(() => { return Promise.reject(new Error('test')) })
    be.init()

    var exitStub = Sinon.stub(process, 'exit')
    exitStub.withArgs(1).returns(true)

    be.doActions()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    }, 30)
  })

  it('Should exit with 1 when exit handler throws an error', function (done) {
    const be = new BeforeExit()
    be.addAction(() => { throw new Error('test') })
    be.init()

    var exitStub = Sinon.stub(process, 'exit')
    exitStub.withArgs(1).returns(true)

    be.doActions()

    setTimeout(() => {
      expect(exitStub.called).to.be.equals(true)
      exitStub.restore()
      done()
    }, 30)
  })
})
