'use strict'

describe('Util', function() {
  it('Should be able to convert NATS wildcard subject to the RegexExp equivalent', function(done) {
    const tokenWildcard = 'europe-system.*'
    const fullWildcard = 'europe-system.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^europe-system.[a-zA-Z0-9\-]+$/i)
    expect(regex2).to.be.equals(/^europe-system.[a-zA-Z0-9\-\.]+$/i)
    done()
  })

  it('Should be able to convert NATS wildcard subject to the RegexExp in different positions', function(done) {
    const tokenWildcard = 'a.*.b'
    const fullWildcard = 'a.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^a.[a-zA-Z0-9\-]+.b$/i)
    expect(regex2).to.be.equals(/^a.[a-zA-Z0-9\-\.]+$/i)
    done()
  })

  it('Extract schema', function(done) {
    let schema = HemeraUtil.extractSchema({
      topic: 'foo',
      fn: function() {},
      a: { b: 1 }
    })
    expect(schema).to.be.equals({ a: { b: 1 } })

    schema = HemeraUtil.extractSchema(null)
    expect(schema).to.be.equals(null)

    done()
  })

  it('Generate random id', function(done) {
    let schema = HemeraUtil.randomId()
    expect(schema).to.be.string()
    expect(schema.length).to.be.equals(32)

    done()
  })

  it('wrapFuncAsPromise', function(done) {
    const a = function() {}
    let fn = HemeraUtil.wrapFuncAsPromise(a)
    expect(fn).to.be.function()
    expect(fn.length).to.be.equals(0)
    expect(fn).to.be.equals(a)

    done()
  })

  it('Clean pattern', function(done) {
    let pattern = HemeraUtil.cleanPattern({
      topic: 'foo',
      test$: 'a',
      regex: /./,
      fn: function() {},
      a: { b: 1 }
    })
    expect(pattern).to.be.equals({ regex: /./, topic: 'foo' })

    pattern = HemeraUtil.cleanPattern(null)
    expect(pattern).to.be.equals(null)

    done()
  })

  it('Clean from special variables', function(done) {
    let obj = {
      topic: 'foo',
      test$: 'a',
      a: { b: 1 }
    }
    let pattern = HemeraUtil.cleanFromSpecialVars(obj)
    expect(pattern).to.be.equals({
      topic: 'foo',
      a: { b: 1 }
    })
    expect(obj).to.be.equals({
      topic: 'foo',
      test$: 'a',
      a: { b: 1 }
    })

    pattern = HemeraUtil.cleanFromSpecialVars(null)
    expect(pattern).to.be.equals(null)

    done()
  })

  it('Get pattern in string form', function(done) {
    // special $ variables
    let pattern = HemeraUtil.pattern({
      topic: 'foo',
      test$: 'a',
      a: { b: 1 },
      fn: function() {}
    })

    expect(pattern).to.be.equals('topic:foo')

    // return as it is
    pattern = HemeraUtil.pattern('topic:foo')
    expect(pattern).to.be.equals('topic:foo')

    // null
    pattern = HemeraUtil.pattern(null)
    expect(pattern).to.be.equals('')

    // regex
    pattern = HemeraUtil.pattern({
      topic: /./
    })
    expect(pattern).to.be.equals('topic:/./')

    done()
  })
})
