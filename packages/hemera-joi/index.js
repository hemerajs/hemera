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
      return Joi.validate(
        pattern,
        Object.assign(preSchema, opts.basePreSchema),
        opts.pre
      )
    }
  })

  // Response validation
  hemera.setResponseSchemaCompiler(schema => payload => {
    const postSchema = schema[opts.patternKeys.post]

    if (postSchema) {
      return Joi.validate(
        payload,
        Object.assign(postSchema, opts.basePostSchema),
        opts.post
      )
    } else if (opts.basePostSchema) {
      return Joi.validate(payload, opts.basePostSchema)
    }
  })

  done()
}

module.exports = Hp(hemeraJoi, {
  hemera: '>=5.1.0',
  scoped: false, // set schema globally
  name: require('./package.json').name,
  options: {
    basePreSchema: null,
    basePostSchema: null,
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
