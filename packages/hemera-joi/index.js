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
  hemera.setResponseSchemaCompiler(schema => payload => {
    const postSchema = schema[opts.patternKeys.post]

    if (postSchema) {
      return Joi.validate(payload, postSchema, opts.post)
    }
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
