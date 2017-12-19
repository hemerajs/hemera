'use strict'

const SnappyJS = require('snappyjs')
const Hp = require('hemera-plugin')

function hemeraSnappy(hemera, opts, done) {
  function uncompress(msg) {
    try {
      return {
        value: SnappyJS.uncompress(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  function compress(msg) {
    try {
      return {
        value: SnappyJS.compress(Buffer.from(msg))
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  hemera.encoder.add(compress)
  // first uncompress then decode
  hemera.decoder.first(uncompress)

  done()
}

const plugin = Hp(hemeraSnappy, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
module.exports = plugin
