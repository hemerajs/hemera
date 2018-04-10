'use strict'

const HemeraPlugin = require('./../../packages/hemera-plugin')
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
})
