'use strict'

const Parambulator = require('parambulator')

exports.plugin = function hemeraParambulator() {

  var hemera = this

  hemera.ext('onServerPreHandler', function (req, res, next) {

    let plugin = this._actMeta.plugin
    let schema = this._actMeta.schema
    let pattern = req.payload.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next.continue()
    }

    let pbSchema = schema.pb$ || schema

    let paramcheck = Parambulator(pbSchema)
    paramcheck.validate(pattern, (err) => {

      res.send(err)
    })

  })

}

exports.options = {}

exports.attributes = {
  name: 'hemera-parambulator'
}
