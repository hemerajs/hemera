'use strict'

const Joi = require('joi')

exports.plugin = function hemeraJoi () {
  var hemera = this

  hemera.expose('joi', Joi)
  const PreValidationError = hemera.createError('PreValidationError')
  const PostValidationError = hemera.createError('PostValidationError')

  hemera.ext('onServerPreHandler', function (req, res, next) {
    let plugin = this._actMeta.plugin
    let schema = this._actMeta.schema
    let pattern = req.payload.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next()
    }

    let joiSchema = schema

    if (schema.joi$) {
      if (schema.joi$.pre) {
        joiSchema = schema.joi$.pre
      } else {
        joiSchema = schema.joi$
      }
    }

    Joi.validate(pattern, joiSchema, {
      allowUnknown: true
    }, (err, value) => {
      req.payload.pattern = value
      if (err) {
        res.send(new PreValidationError({ message: err.message, details: err.details }))
      } else {
        res.send()
      }
    })
  })

  hemera.ext('onServerPreResponse', function (req, res, next) {
    let plugin = this._actMeta.plugin
    let schema = this._actMeta.schema
    let response = res.payload
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next()
    }

    let joiSchema = null

    if (schema.joi$) {
      if (schema.joi$.post) {
        joiSchema = schema.joi$.post
      } else {
        return next()
      }
    } else {
      return next()
    }

    Joi.validate(response, joiSchema, {
      allowUnknown: true
    }, (err, value) => {
      res.payload = value
      if (err) {
        res.send(new PostValidationError({ message: err.message, details: err.details }))
      } else {
        res.send()
      }
    })
  })
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
