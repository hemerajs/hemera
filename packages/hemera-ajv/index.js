'use strict'

const Hp = require('hemera-plugin')
const SchemaStore = require('./schemaStore')
const Ajv = require('ajv')

function hemeraAjv(hemera, opts, done) {
  const requestSchemaKey = Symbol('ajv.request-schema')
  const responseSchemaKey = Symbol('ajv.response-schema')
  const ajv = new Ajv(opts.ajv)
  const store = new SchemaStore()

  hemera.decorate('addSchema', schema => store.add(schema))

  // compile schemas
  hemera.ext('onAdd', addDefinition => {
    if (addDefinition.schema.properties) {
      addDefinition.schema[requestSchemaKey] = ajv.compile({
        type: 'object',
        properties: addDefinition.schema.properties
      })
    } else if (addDefinition.schema.schema) {
      store.traverse(addDefinition.schema.schema)

      if (addDefinition.schema.schema.request) {
        addDefinition.schema[requestSchemaKey] = ajv.compile(
          addDefinition.schema.schema.request
        )
      }
      if (addDefinition.schema.schema.response) {
        addDefinition.schema[responseSchemaKey] = ajv.compile(
          addDefinition.schema.schema.response
        )
      }
    }
  })

  // Request validation
  hemera.setSchemaCompiler(schema => pattern => {
    if (
      typeof schema[requestSchemaKey] === 'function' &&
      schema[requestSchemaKey](pattern) === false
    ) {
      const error = new Error(
        ajv.errorsText(schema[requestSchemaKey].errors, { dataVar: 'pattern' })
      )
      error.validation = schema[requestSchemaKey].errors
      return {
        error
      }
    }
  })

  // Response validation
  hemera.setResponseSchemaCompiler(schema => payload => {
    const validate = schema[responseSchemaKey]
    if (validate) {
      if (validate(payload) === false) {
        const error = new Error(
          ajv.errorsText(validate.errors, {
            dataVar: 'response'
          })
        )
        return {
          error
        }
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
    ajv: {
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: true
    }
  }
})
