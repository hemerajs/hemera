'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  hemera.decorate('joi', Joi)

  // Request validation
  hemera.setSchemaCompiler(schema => pattern => {
    const preSchema = schema[opts.patternKeys.post]
      ? schema[opts.patternKeys.pre] || schema[opts.patternKeys.default]
      : schema[opts.patternKeys.default] ||
        schema[opts.patternKeys.pre] ||
        schema

    if (preSchema) {
      return Joi.validate(pattern, preSchema, opts.pre)
    }
  })

  // Response validation
  hemera.ext('onServerPreResponse', (hemera, request, reply, next) => {
    // pattern could not be found or error was already set
    if (!hemera.matchedAction || reply.error) {
      next()
      return
    }

    const schema = hemera.matchedAction.schema[opts.patternKeys.post]

    // only validate payload when no error was set
    if (!reply.error && schema) {
      Joi.validate(reply.payload, schema, opts.post, (err, value) => {
        if (err) {
          reply.error = err
          next(err)
        } else {
          reply.payload = value
          next()
        }
      })
      return
    }
    next()
  })

  done()
}

module.exports = Hp(hemeraJoi, {
  hemera: '>=5.0.0-rc.5',
  scoped: false, // set schema globally
  name: require('./package.json').name,
  options: {
    patternKeys: {
      default: 'joi$',
      pre: 'preJoi$',
      post: 'postJoi$'
    },
    // joi settings
    pre: { allowUnknown: true },
    post: { stripUnknown: true }
  }
})
