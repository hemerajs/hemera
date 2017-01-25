'use strict'

const Avro = require('avsc')
const avroType = require('./avro')

exports.plugin = function hemeraAvro() {

  const hemera = this

  const type = Avro.parse(avroType)

  hemera._decoder.decode = (msg) => {

    try {

      let m = type.fromBuffer(msg)

      // parse buffer as json when user transfer complex type
      if (Buffer.isBuffer(m.result)) {

        m.result = JSON.parse(m.result)
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

  hemera._encoder.encode = (msg) => {

    try {

      if (typeof msg.result === 'object') {

        msg.result = new Buffer(JSON.stringify(msg.result))
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
