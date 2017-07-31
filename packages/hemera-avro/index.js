'use strict'

const Hp = require('hemera-plugin')
const Avro = require('avsc')
const avroType = require('./avro')
const SafeStringify = require('nats-hemera/lib/encoder').encode
const SafeParse = require('nats-hemera/lib/decoder').decode

exports.plugin = Hp(function hemeraAvro () {
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

  function decode (msg) {
    try {
      let m = type.fromBuffer(msg)

      // client response encoding
      if (Buffer.isBuffer(m.result)) {
        if (m.meta.avro) {
          // response is decoded with avro schema
          m.result = this._pattern.avro$.fromBuffer(m.result)
        } else {
          // response are bytes
          const p = SafeParse(m.result)
          if (p.error) {
            throw p.error
          } else {
            m.result = p.value
          }
        }
      }

      // Pattern is encoded as JSON
      if (Buffer.isBuffer(m.pattern)) {
        // response are bytes
        const p = SafeParse(m.pattern)
        if (p.error) {
          throw p.error
        } else {
          m.pattern = p.value
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

  function encode (msg) {
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
            const p = SafeStringify(msg.result)
            if (p.error) {
              throw p.error
            } else {
              msg.result = Buffer.from(p.value)
            }
          }
        }
      } else {
        // Encode pattern to JSON byte-array
        const p = SafeStringify(msg.pattern)
        if (p.error) {
          throw p.error
        } else {
          msg.pattern = Buffer.from(p.value)
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

  // Will replace default encoder/decoder
  hemera.decoder.reset(decode)
  hemera.encoder.reset(encode)
})

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
