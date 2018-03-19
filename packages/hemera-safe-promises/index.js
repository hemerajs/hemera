'use strict'

const Hp = require('hemera-plugin')

function hemeraSafePromises(hemera, opts, done) {
  const mps = require('make-promises-safe')
  mps.abort = !!opts.abort
  done()
}

const plugin = Hp(hemeraSafePromises, {
  hemera: '>=5.0.0-rc.1',
  name: require('./package.json').name
})

module.exports = plugin
