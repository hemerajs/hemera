'use strict'

describe('Util', function() {
  it('Should be able to convert NATS wildcard subject to RegexExp equivalent', function(done) {
    const tokenWildcard = 'europe-system.*.foo-bar'
    const fullWildcard = 'europe-system.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^europe-system\.[a-zA-Z0-9-]+\.foo-bar$/i)
    expect(regex1.test('europe-system.test.foo-bar')).to.be.equals(true)
    expect(regex1.test('europe-system.test.foo')).to.be.equals(false)

    expect(regex2).to.be.equals(/^europe-system\.[a-zA-Z0-9-.]+$/i)
    expect(regex2.test('europe-system.foo-bar')).to.be.equals(true)
    done()
  })

  it('Should be able to convert NATS wildcard subject to RegexExp equivalent in different positions', function(done) {
    const tokenWildcard = 'a.*.b'
    const fullWildcard = 'a.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^a\.[a-zA-Z0-9-]+\.b$/i)
    expect(regex1.test('a.foo.b')).to.be.equals(true)
    expect(regex1.test('a.foo.b.c')).to.be.equals(false)

    expect(regex2).to.be.equals(/^a\.[a-zA-Z0-9-.]+$/i)
    expect(regex2.test('a.foo.b.bar')).to.be.equals(true)
    expect(regex2.test('a.foo.b.bar.c')).to.be.equals(true)
    done()
  })

  it('Should be able to convert NATS wildcard subject to RegexExp equivalent with multiple occurences', function(done) {
    const tokenWildcard = 'a.*.b.*'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    expect(regex1).to.be.equals(/^a\.[a-zA-Z0-9-]+\.b\.[a-zA-Z0-9-]+$/i)
    expect(regex1.test('a.foo.b.bar')).to.be.equals(true)
    expect(regex1.test('a.b.bar')).to.be.equals(false)
    done()
  })

  it('Should return RegExp as it is', function(done) {
    const reg = /^a\.[a-zA-Z0-9-]+\.b$/i
    const regex1 = HemeraUtil.natsWildcardToRegex(reg)
    expect(reg).to.be.equals(regex1)
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
