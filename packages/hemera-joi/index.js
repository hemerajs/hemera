'use strict'

const Joi = require('joi')

exports.plugin = function hemeraJoi() {

  var hemera = this

  hemera.expose('joi', Joi)

  hemera.ext('onServerPreHandler', function (next) {

    let plugin = this._actMeta.plugin
    let schema = this._actMeta.schema
    let pattern = this._request.value.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next()
    }

    Joi.validate(pattern, schema, {
      allowUnknown: true
    }, (err, value) => {

      this._request.value.pattern = value

      next(err)
    })

  })

}

exports.options = {
}

exports.attributes = {
  name: 'hemera-joi'
}
