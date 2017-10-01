describe('CodecPipeline', function() {
  it('Should add a pipeline step', function(done) {
    const p = new CodecPipeline()
    p.add(val => {
      return { value: val + 2, error: null }
    })

    expect(p.run(10).value).to.be.equals(12)
    done()
  })

  it('Should move to the first pipeline step', function(done) {
    const p = new CodecPipeline()
    p.add(val => {
      return { value: val / 2, error: null }
    })
    p.add(val => {
      return { value: val + 2, error: null }
    })
    p.first(val => {
      return { value: val * 2, error: null }
    })

    expect(p.run(10).value).to.be.equals(12)
    done()
  })

  it('Should reset the pipeline', function(done) {
    const p = new CodecPipeline()
    p.add(val => {
      return { value: val / 2, error: null }
    })
    p.add(val => {
      return { value: val + 2, error: null }
    })
    p.first(val => {
      return { value: val * 2, error: null }
    })
    p.reset()

    expect(p.run(10).value).to.be.equals(10)
    done()
  })

  it('Should return pipeline error', function(done) {
    const p = new CodecPipeline()
    p.add(val => {
      return { value: val / 2, error: null }
    })
    p.add(val => {
      return { value: val + 2, error: new Error('test') }
    })

    const r = p.run(10)
    expect(r.error.name).to.be.equals('Error')
    done()
  })
})
