'use strict'

const Avro = require('avsc')
const avroType = require('./avro')

exports.plugin = function hemeraAvro () {
  const hemera = this
  const type = Avro.parse(avroType)

  hemera.expose('avro', Avro)

  hemera.ext('onClientPreRequest', function (next) {
    // mark that request as "avro encoded" so we can easily determine how to decode the response
    if (this._pattern.avro$) {
      this.meta$.avro = true
    }

    next()
  })

  hemera._decoder.decode = function (msg) {
    try {
      let m = type.fromBuffer(msg)

      // client response encoding
      if (Buffer.isBuffer(m.result)) {
        if (m.meta.avro) {
          // response is decoded with avro schema
          m.result = this._pattern.avro$.fromBuffer(m.result)
        } else {
          // response are bytes
          m.result = JSON.parse(m.result)
        }
      }

      return {
        value: m
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  hemera._encoder.encode = function (msg) {
    try {
      // server request encoding
      if (this._isServer) {
        // do not encode when result is just 'null', default value of property `result` is already null
        if (msg.result !== null) {
          if (this.meta$.avro) {
            // payload is encoded with avro schema
            msg.result = this._actMeta.schema.avro$.toBuffer(msg.result)
          } else {
            // payload are bytes
            msg.result = new Buffer(JSON.stringify(msg.result))
          }
        }
      }

      return {
        value: type.toBuffer(msg)
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
