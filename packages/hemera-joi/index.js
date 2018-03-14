'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  const PayloadValidationError = hemera.createError('PayloadValidationError')
  const pluginName = hemera.plugin$.name

  hemera.decorate('joi', Joi)
  hemera.decorate('joiErrors', {
    PayloadValidationError
  })

  hemera.ext('onServerPreHandler', function(ctx, req, res, next) {
    const plugin = ctx.matchedAction.plugin
    const schema = ctx.matchedAction.schema
    const pattern = req.payload.pattern
    const currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== pluginName) {
      return next()
    }

    let joiSchema = schema

    if (schema.joi$) {
      joiSchema = schema.joi$
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
            new PayloadValidationError({
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

module.exports = Hp(hemeraJoi, {
  hemera: '^4.0.0',
  name: require('./package.json').name
})
