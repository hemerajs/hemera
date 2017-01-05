'use strict'

var msgpack = require('msgpack5')(),
  encode = msgpack.encode,
  decode = msgpack.decode

exports.plugin = function hemeraArangoStore(options) {

  const hemera = this

  hemera.decoder = { decode }
  hemera.encoder = { encode }

}

exports.options = {
}

exports.attributes = {
  name: 'hemera-msgpack'
}
