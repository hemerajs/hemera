'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraJoi(hemera, opts, done) {
  hemera.decorate('joi', Joi)

  hemera.setSchemaCompiler(schema => pattern =>
    Joi.validate(pattern, schema.joi$ || schema, {
      allowUnknown: true
    })
  )

  done()
}

module.exports = Hp(hemeraJoi, {
  hemera: '^4.0.0',
  skipOverride: true,
  name: require('./package.json').name
})
