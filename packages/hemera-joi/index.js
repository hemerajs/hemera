'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  const PreValidationError = hemera.createError('PreValidationError')
  const PostValidationError = hemera.createError('PostValidationError')
  const pluginName = hemera.plugin$.name

  hemera.decorate('joi', Joi)
  hemera.decorate('joiErrors', {
    PreValidationError,
    PostValidationError
  })

  hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
    let plugin = ctx._actMeta.plugin
    let schema = ctx._actMeta.schema
    let pattern = req.payload.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== pluginName) {
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

    Joi.validate(
      pattern,
      joiSchema,
      {
        allowUnknown: true
      },
      (err, value) => {
        req.payload.pattern = value
        if (err) {
          next(
            new PreValidationError({
              message: err.message,
              details: err.details
            })
          )
        } else {
          next()
        }
      }
    )
  })

  hemera.ext('onServerPreResponse', function(ctx, req, res, next) {
    // actMeta can be null when pattern was not found
    if (!ctx._actMeta) {
      return next()
    }

    let plugin = ctx._actMeta.plugin
    let schema = ctx._actMeta.schema
    let response = res.payload
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== pluginName) {
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

    Joi.validate(
      response,
      joiSchema,
      {
        allowUnknown: true
      },
      (err, value) => {
        if (err) {
          next(
            new PostValidationError({
              message: err.message,
              details: err.details
            })
          )
        } else {
          res.send(value)
          next()
        }
      }
    )
  })

  done()
}

const plugin = Hp(hemeraJoi, '>=3')
plugin[Symbol.for('name')] = require('./package.json').name

module.exports = plugin
