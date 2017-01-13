'use strict'

const Parambulator = require('parambulator')

exports.plugin = function hemeraParambulator() {

  var hemera = this

  hemera.ext('onServerPreHandler', function (next) {

    let plugin = this._actMeta.plugin
    let schema = this._actMeta.schema
    let pattern = this._request.value.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next()
    }

    let paramcheck = Parambulator(schema)
    paramcheck.validate(pattern, (err) => {

      next(err)
    })

  })

}

exports.options = {
}

exports.attributes = {
  name: 'hemera-parambulator'
}
