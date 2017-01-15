'use strict'

var msgpack = require('msgpack5')(),
  encode = msgpack.encode,
  decode = msgpack.decode

exports.plugin = function hemeraMsgpack() {

  const hemera = this

  hemera._decoder.decode = (a) => {

    try {

      return {
        value: decode(a),
        error: null
      }

    } catch (err) {

      return {
        value: null,
        error: err
      }
    }
  }

  hemera._encoder.encode = (a) => {

    return encode(a)
  }

}

exports.options = {}

exports.attributes = {
  name: 'hemera-msgpack'
}
