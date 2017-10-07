'use strict'

describe('Util Async / Await', function() {
  it('Should be able to detect async function', function(done) {
    const a = HemeraUtil.isAsyncFunction(async function test() {})
    const b = HemeraUtil.isAsyncFunction(function test() {})
    const c = HemeraUtil.isAsyncFunction('')
    expect(a).to.be.equals(true)
    expect(b).to.be.equals(false)
    expect(c).to.be.equals(false)
    done()
  })

  it('wrapFuncAsPromise', function(done) {
    const a = async function() {}
    let fn = HemeraUtil.wrapFuncAsPromise(a)
    expect(fn).to.be.function()
    expect(fn.length).to.be.equals(0)
    expect(fn).to.be.not.equals(a)

    done()
  })
})
