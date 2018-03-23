# Hemera-ajv package

[![npm](https://img.shields.io/npm/v/hemera-ajv.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-ajv)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Ajv](https://github.com/epoberezkin/ajv) (JSON-Schema) for request validation.

#### Example

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-ajv'))
```

## Request validation

The primary purpose of ajv is to validate the incoming request. You can define your validation schema with the `ajv$` property.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    ajv$: {
      type: 'object',
      properties: {
        a: { type: 'number' },
        b: { type: 'number' }
      }
    }
  },
  (req, cb) => {
    cb(null, req.a + req.b)
  }
)
```

### Change Ajv settings

```js
const hemera = new Hemera(nats)
hemera.use(
  require('hemera-ajv', {
    patternKeys: {
      default: 'ajv'
    },
    ajv: {
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: true
    }
  })
)
```
