'use strict'

const Hp = require('hemera-plugin')
const SchemaStore = require('./schemaStore')
const Ajv = require('ajv')

function hemeraAjv(hemera, opts, done) {
  const requestSchemaKey = Symbol('ajv.request-schema')
  const responseSchemaKey = Symbol('ajv.response-schema')
  const isResponseObjectSchemaKey = Symbol('ajv.response-object-schema')
  const isResponseArraySchemaKey = Symbol('ajv.response-array-schema')
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
        const inferedType = inferTypeByKeyword(
          addDefinition.schema.schema.response
        )
        if (inferedType === 'object') {
          addDefinition.schema[isResponseObjectSchemaKey] = true
        } else if (inferedType === 'array') {
          addDefinition.schema[isResponseArraySchemaKey] = true
        }
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
      const isObjectSchema = schema[isResponseObjectSchemaKey]
      const isArraySchema = schema[isResponseArraySchemaKey]
      if (typeof payload !== 'object' && (isObjectSchema || isArraySchema)) {
        if (isObjectSchema) {
          return {
            error: new Error('response should be an object')
          }
        }
        return {
          error: new Error('response should be an array')
        }
      } else if (validate(payload) === false) {
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

const objectKeywords = [
  'maxProperties',
  'minProperties',
  'required',
  'properties',
  'patternProperties',
  'additionalProperties',
  'dependencies'
]

const arrayKeywords = [
  'items',
  'additionalItems',
  'maxItems',
  'minItems',
  'uniqueItems',
  'contains'
]

/**
 * Infer type based on keyword in order return an error when undefined or primitive is returned
 * because ajv won't return an error
 * https://json-schema.org/latest/json-schema-validation.html#rfc.section.6
 */
function inferTypeByKeyword(schema) {
  for (const keyword of objectKeywords) {
    if (keyword in schema) return 'object'
  }
  for (const keyword of arrayKeywords) {
    if (keyword in schema) return 'array'
  }
  return schema.type
}

module.exports = Hp(hemeraAjv, {
  hemera: '>=5.1.0',
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
