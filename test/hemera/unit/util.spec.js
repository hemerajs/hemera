'use strict'

describe('Util', function() {
  it('Should be able to convert NATS wildcard subject to the RegexExp equivalent', function(
    done
  ) {
    const tokenWildcard = 'europe-system.*'
    const fullWildcard = 'europe-system.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^europe-system.[a-zA-Z0-9\-]+$/i)
    expect(regex2).to.be.equals(/^europe-system.[a-zA-Z0-9\-\.]+$/i)
    done()
  })

  it('Should be able to convert NATS wildcard subject to the RegexExp in different positions', function(
    done
  ) {
    const tokenWildcard = 'a.*.b'
    const fullWildcard = 'a.>'
    const regex1 = HemeraUtil.natsWildcardToRegex(tokenWildcard)
    const regex2 = HemeraUtil.natsWildcardToRegex(fullWildcard)
    expect(regex1).to.be.equals(/^a.[a-zA-Z0-9\-]+.b$/i)
    expect(regex2).to.be.equals(/^a.[a-zA-Z0-9\-\.]+$/i)
    done()
  })
})
