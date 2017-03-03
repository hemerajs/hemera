'use strict'

const msgpack = require('msgpack-lite')
const encode = msgpack.encode
const decode = msgpack.decode

exports.plugin = function hemeraMsgpack () {
  const hemera = this

  hemera._decoder.decode = (msg) => {
    try {
      return {
        value: decode(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  hemera._encoder.encode = (msg) => {
    try {
      return {
        value: encode(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
