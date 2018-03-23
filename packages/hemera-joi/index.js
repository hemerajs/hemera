'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  hemera.decorate('joi', Joi)

  // Request validation
  hemera.setSchemaCompiler(schema => pattern => {
    const preSchema = schema.postJoi$
      ? schema.preJoi$ || schema.joi$
      : schema.joi$ || schema.preJoi$ || schema

    if (preSchema) {
      return Joi.validate(pattern, preSchema, opts.pre)
    }
  })

  // Response validation
  hemera.ext('onServerPreResponse', (hemera, request, reply, next) => {
    const schema = hemera.matchedAction
      ? hemera.matchedAction.schema.postJoi$
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
  hemera: '>=5.0.0-rc.1',
  scoped: false, // set schema globally
  name: require('./package.json').name,
  options: {
    pre: { allowUnknown: true },
    post: { stripUnknown: true }
  }
})
