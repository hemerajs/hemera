'use strict'

const Hp = require('hemera-plugin')
const msgpack = require('msgpack-lite')

exports.plugin = Hp(function hemeraMsgpack () {
  const hemera = this

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
}, '>=1.4.1')

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
