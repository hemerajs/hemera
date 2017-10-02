'use strict'

const Hp = require('hemera-plugin')
const Parambulator = require('parambulator')

exports.plugin = Hp(hemeraParambulator, '>=1.5.0')
exports.options = {
  name: require('./package.json').name
}

function hemeraParambulator (hemera, opts, done) {
  const PreValidationError = hemera.createError('PreValidationError')

  hemera.decorate('parambulatorErrors', {
    PreValidationError
  })

  hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
    let plugin = ctx._actMeta.plugin
    let schema = ctx._actMeta.schema
    let pattern = req.payload.pattern
    let currentPayloadValidator = plugin.options.payloadValidator

    if (currentPayloadValidator !== exports.options.name) {
      return next()
    }

    let pbSchema = schema.pb$ || schema

    let paramcheck = Parambulator(pbSchema)
    paramcheck.validate(pattern, err => {
      if (err) {
        return next(
          new PreValidationError({
            message: err.message,
            details: err.parambulator
          })
        )
      }
      next()
    })
  })

  done()
}
