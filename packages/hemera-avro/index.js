'use strict'
// include only serialization support
const Avro = require('avsc')
const avroType = require('./avro')

exports.plugin = function hemeraAvro() {

  const hemera = this

  const type = Avro.parse(avroType)

  hemera.ext('onClientPreRequest', function (next) {

    if (this._pattern.avro$) {
      this.meta$.avro = true
    }

    return next()

  })

  hemera._decoder.decode = function (msg) {

    try {

      let m = type.fromBuffer(msg)

      // client response encoding
      if (Buffer.isBuffer(m.result)) {

        if (m.meta.avro) {

          m.result = this._pattern.avro$.fromBuffer(m.result)
        } else {

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
      if (typeof msg.result === 'object') {

        if (this.meta$.avro) {

          msg.result = this._actMeta.schema.avro$.toBuffer(msg.result)
        } else {

          msg.result = new Buffer(JSON.stringify(msg.result))
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
  name: 'hemera-avro',
  description: 'Avro data serialization system'
}
