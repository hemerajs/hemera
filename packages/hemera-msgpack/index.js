'use strict'

const Hp = require('hemera-plugin')
const msgpack5 = require('msgpack5')

function hemeraMsgpack(hemera, opts, done) {
  const msgpack = msgpack5(opts)

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
  hemera: '>=5.0.0',
  scoped: false,
  // eslint-disable-next-line global-require
  name: require('./package.json').name
})

module.exports = plugin
