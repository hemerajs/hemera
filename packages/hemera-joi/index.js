'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  hemera.decorate('joi', Joi)

  const patternKeys = {}
  for (const key in opts.patternKeys) {
    patternKeys[key] = opts.patternKeys[key] + '$'
  }

  // Request validation
  hemera.setSchemaCompiler(schema => pattern => {
    const preSchema = schema[patternKeys.post]
      ? schema[patternKeys.pre] || schema[patternKeys.default]
      : schema[patternKeys.default] || schema[patternKeys.pre] || schema

    if (preSchema) {
      return Joi.validate(pattern, preSchema, opts.pre)
    }
  })

  // Response validation
  hemera.ext('onServerPreResponse', (hemera, request, reply, next) => {
    const schema = hemera.matchedAction
      ? hemera.matchedAction.schema[patternKeys.post]
      : false

    if (schema) {
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
      default: 'joi',
      pre: 'preJoi',
      post: 'postJoi'
    },
    // joi settings
    pre: { allowUnknown: true },
    post: { stripUnknown: true }
  }
})
