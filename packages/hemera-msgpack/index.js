'use strict'

const Hp = require('hemera-plugin')
const msgpack = require('msgpack-lite')

function hemeraMsgpack(hemera, opts, done) {
  function decode(msg) {
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

  function encode(msg) {
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

const plugin = Hp(hemeraMsgpack, {
  hemera: '^4.0.0',
  name: require('./package.json').name
})

module.exports = plugin
