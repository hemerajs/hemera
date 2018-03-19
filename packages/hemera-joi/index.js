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
  hemera: '>=5.0.0-rc.1',
  scoped: false, // set schema globally
  name: require('./package.json').name
})
