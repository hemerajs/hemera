'use strict'

const SnappyJS = require('snappyjs')
const Hp = require('hemera-plugin')

exports.plugin = Hp(hemeraSnappy, '>=1.4.1')
exports.options = {
  name: require('./package.json').name
}

function hemeraSnappy (hemera, opts, done) {
  function uncompress (msg) {
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

  function compress (msg) {
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
