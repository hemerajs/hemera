'use strict'

const Joi = require('joi')

exports.plugin = function hemeraJoi() {

  var hemera = this

  hemera.ext('onServerPreHandler', function (next) {

    let schema = this._actMeta.schema
    let pattern = this._request.value.pattern

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
