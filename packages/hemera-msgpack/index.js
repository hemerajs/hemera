'use strict'

const Hp = require('hemera-plugin')
const msgpack = require('msgpack-lite')

exports.plugin = Hp(hemeraMsgpack, '>=1.4.1')
exports.options = {
  name: require('./package.json').name
}

function hemeraMsgpack (hemera, opts, done) {
  function decode (msg) {
    try {
      return {
        value: msgpack.decode(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  function encode (msg) {
    try {
      return {
        value: msgpack.encode(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  // Will replace default encoder/decoder
  hemera.decoder.reset(decode)
  hemera.encoder.reset(encode)

  done()
}
