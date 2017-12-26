'use strict'

const Hp = require('hemera-plugin')

function hemeraSafePromises(hemera, opts, done) {
  const mps = require('make-promises-safe')
  mps.abort = !!opts.abort
  done()
}

const plugin = Hp(hemeraSafePromises, '>=3')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {}
module.exports = plugin
