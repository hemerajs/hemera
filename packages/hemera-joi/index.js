'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

exports.plugin = Hp(function hemeraJoi () {
  const hemera = this
  const PreValidationError = hemera.createError('PreValidationError')
  const PostValidationError = hemera.createError('PostValidationError')

  hemera.expose('joi', Joi)

  hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
    let plugin = ctx._actMeta.plugin
    let schema = ctx._actMeta.schema
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

  hemera.ext('onServerPreResponse', function (ctx, req, res, next) {
    // actMeta can be null when pattern was not found
    if (!ctx._actMeta) {
      return next()
    }

    let plugin = ctx._actMeta.plugin
    let schema = ctx._actMeta.schema
    let response = res.payload
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.attributes.name) {
      return next()
    }

    let joiSchema = null

    if (schema.joi$) {
      if (schema.joi$.post) {
        joiSchema = schema.joi$.post
        // when no response was set but we want to support default values by joi
        if (response === undefined) {
          response = {}
        }
      } else {
        return next()
      }
    } else {
      return next()
    }

    Joi.validate(response, joiSchema, {
      allowUnknown: true
    }, (err, value) => {
      if (err) {
        res.send(new PostValidationError({ message: err.message, details: err.details }))
      } else {
        res.send(value)
      }
    })
  })
}, '>=1.5.0')

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
