'use strict'

describe('Util Async / Await', function () {
  it('Should be able to detect async function', function (done) {
    const a = HemeraUtil.isAsyncFunction(async function test () {})
    const b = HemeraUtil.isAsyncFunction(function test () {})
    const c = HemeraUtil.isAsyncFunction('')
    expect(a).to.be.equals(true)
    expect(b).to.be.equals(false)
    expect(c).to.be.equals(false)
    done()
  })
})
