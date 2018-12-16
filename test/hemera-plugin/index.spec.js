'use strict'

const HemeraPlugin = require('./../../packages/hemera-plugin')
const extractPluginName = require('./../../packages/hemera-plugin/stackParser')
const Proxyquire = require('proxyquire')

describe('Hemera plugin', function() {
  it('Should register a plugin', function(done) {
    HemeraPlugin(function(hemera, opts, done) {
      done()
    })

    done()
  })

  it('Should not throw if hemera is not found', function(done) {
    const HemeraPlugin = Proxyquire('./../../packages/hemera-plugin/index.js', {
      'nats-hemera/package.json': null,
      console: {
        info: function(msg) {
          expect(msg).to.be.equals('hemera not found, proceeding anyway')
          done()
        }
      }
    })

    function plugin(hemera, opts, done) {
      done()
    }

    HemeraPlugin(plugin, '>= 0')
  })

  it('Should throw an error because semver version does not match', function(done) {
    const throws = function() {
      HemeraPlugin(function(hemera, opts, done) {
        done()
      }, '500.400.300')
    }

    expect(throws).to.throw(Error)
    done()
  })

  it('Should throw an error because plugin function is not a function', function(done) {
    const throws = function() {
      HemeraPlugin(true, '1')
    }

    expect(throws).to.throw(
      Error,
      "hemera-plugin expects a function, instead got a 'boolean'"
    )
    done()
  })

  it('Should throw an error because plugin version is not a string', function(done) {
    const throws = function() {
      HemeraPlugin(() => {}, { hemera: true })
    }

    expect(throws).to.throw(
      Error,
      "hemera-plugin expects a version string, instead got 'boolean'"
    )
    done()
  })

  it('Should accept plugin opts', function(done) {
    let plugin = HemeraPlugin(
      (hemera, opts, next) => {
        next()
      },
      {
        hemera: '>=5.0.0',
        name: 'myPlugin',
        scoped: false,
        dependencies: ['foo'],
        options: { a: 1 }
      }
    )
    expect(plugin[Symbol.for('plugin-meta')]).to.be.equals({
      name: 'myPlugin',
      scoped: false,
      dependencies: ['foo'],
      options: { a: 1 }
    })
    expect(plugin[Symbol.for('plugin-scoped')]).to.be.equals(false)
    done()
  })

  it('Should scoped by default', function(done) {
    let plugin = HemeraPlugin((hemera, opts, next) => {
      next()
    })
    expect(plugin[Symbol.for('plugin-scoped')]).to.be.equals(true)
    done()
  })

  it('Should scoped by default / 2', function(done) {
    let plugin = HemeraPlugin((hemera, opts, next) => {
      next()
    }, {})
    expect(plugin[Symbol.for('plugin-scoped')]).to.be.equals(true)
    done()
  })

  it('Should generate anonymous plugin name', function(done) {
    let plugin = HemeraPlugin((hemera, opts, next) => {
      next()
    })
    expect(plugin[Symbol.for('plugin-meta')].name).to.be.equals('index.spec')
    done()
  })

  it('Should use plugin-name from error stack', function(done) {
    const winStack = `Error: anonymous function
    at checkName (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\index.js:43:11)
    at plugin (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\index.js:24:20)
    at Test.test (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\test\\hello.test.js:9:14)
    at bound (domain.js:396:14)
    at Test.runBound (domain.js:409:12)
    at ret (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:278:21)
    at Test.main (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:282:7)
    at writeSubComment (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:371:13)
    at TAP.writeSubComment (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:403:5)
    at Test.runBeforeEach (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:370:14)
    at loop (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\function-loop\\index.js:35:15)
    at TAP.runBeforeEach (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:683:7)
    at TAP.processSubtest (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:369:12)
    at TAP.process (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:306:14)
    at TAP.sub (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:185:10)
    at TAP.test (C:\\Users\\leonardo.davinci\\Desktop\\hemera-plugin\\node_modules\\tap\\lib\\test.js:209:17)`

    const nixStack = `Error: anonymous function
    at checkName (/home/leonardo/desktop/hemera-plugin/index.js:43:11)
    at plugin (/home/leonardo/desktop/hemera-plugin/index.js:24:20)
    at Test.test (/home/leonardo/desktop/hemera-plugin/test/this.is.a.test.js:9:14)
    at bound (domain.js:396:14)
    at Test.runBound (domain.js:409:12)
    at ret (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:278:21)
    at Test.main (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:282:7)
    at writeSubComment (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:371:13)
    at TAP.writeSubComment (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:403:5)
    at Test.runBeforeEach (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:370:14)
    at loop (/home/leonardo/desktop/hemera-plugin/node_modules/function-loop/index.js:35:15)
    at TAP.runBeforeEach (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:683:7)
    at TAP.processSubtest (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:369:12)
    at TAP.process (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:306:14)
    at TAP.sub (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:185:10)
    at TAP.test (/home/leonardo/desktop/hemera-plugin/node_modules/tap/lib/test.js:209:17)`

    const anonymousStack = `Unable to parse this`

    expect(extractPluginName(winStack)).to.be.equals('hello.test')
    expect(extractPluginName(nixStack)).to.be.equals('this.is.a.test')
    expect(extractPluginName(anonymousStack)).to.be.equals('anonymous')

    done()
  })
})
