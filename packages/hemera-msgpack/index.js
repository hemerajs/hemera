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

  hemera.setClientDecoder(decode)
  hemera.setClientEncoder(encode)
  hemera.setServerDecoder(decode)
  hemera.setServerEncoder(encode)

  done()
}

const plugin = Hp(hemeraMsgpack, {
  hemera: '>=5.0.0-rc.1',
  scoped: false,
  name: require('./package.json').name
})

module.exports = plugin
