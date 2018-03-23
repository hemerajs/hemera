'use strict'

const Hp = require('hemera-plugin')
const Ajv = require('ajv')

function hemeraAjv(hemera, opts, done) {
  const ajv = new Ajv(opts.ajv)
  const schemaKey = Symbol('ajv')

  const patternKeys = {}
  for (const key in opts.patternKeys) {
    patternKeys[key] = opts.patternKeys[key] + '$'
  }

  // compile schemas
  hemera.ext('onAdd', addDefinition => {
    if (addDefinition.schema[patternKeys.default]) {
      // save compiled schema on server action
      addDefinition.schema[schemaKey] = ajv.compile(
        addDefinition.schema[patternKeys.default]
      )
    }
  })

  // Request validation
  hemera.setSchemaCompiler(schema => pattern => {
    if (schema[schemaKey](pattern) === false) {
      const error = new Error(
        ajv.errorsText(schema[schemaKey].errors, { dataVar: 'pattern' })
      )
      error.validation = schema[schemaKey].errors
      return {
        error: error,
        value: pattern
      }
    }
  })

  done()
}

module.exports = Hp(hemeraAjv, {
  hemera: '>=5.0.0-rc.5',
  scoped: false, // set schema globally
  name: require('./package.json').name,
  options: {
    patternKeys: {
      default: 'ajv'
    },
    ajv: {
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: true
    }
  }
})
