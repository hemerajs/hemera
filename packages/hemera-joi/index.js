'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  const PreValidationError = hemera.createError('PreValidationError')
  const pluginName = hemera.plugin$.name

  hemera.decorate('joi', Joi)
  hemera.decorate('joiErrors', {
    PreValidationError
  })

  hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
    let plugin = ctx.matchedAction.plugin
    let schema = ctx.matchedAction.schema
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

  done()
}

const plugin = Hp(hemeraJoi, {
  hemera: '^4.0.0',
  name: require('./package.json').name
})

module.exports = plugin
