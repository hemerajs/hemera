# Hemera-ajv package

[![npm](https://img.shields.io/npm/v/hemera-ajv.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-ajv)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Ajv](https://github.com/epoberezkin/ajv) (JSON-Schema) for request/response validation.

## Usage

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-ajv'))
```

## Request validation

The primary purpose of ajv is to validate the incoming request.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    }
  },
  (req, cb) => {
    cb(null, req.a + req.b)
  }
)
```

## Response validation

You can also validate your response payload by using the `schema` property where you can define `request` and `response` schemas. Response error isn't validated but must be from type `Error`.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    schema: {
      response: {
        type: 'number'
      }
    }
  },
  (req, cb) => {
    cb(null, req.a + req.b)
  }
)
```

### Reuse schemas

You can reuse schemas across server actions.

```js
hemera.addSchema({
  $id: 'myRequestSchema',
  type: 'object',
  properties: {
    a: { type: 'number' },
    b: { type: 'number' }
  }
})
hemera.addSchema({
  $id: 'myResponseSchema',
  type: 'number'
})
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    schema: {
      request: 'myRequestSchema#',
      response: 'myResponseSchema#'
    }
  },
  (resp, cb) => {
    cb()
  }
)
```

## Change Ajv settings

```js
const hemera = new Hemera(nats)
hemera.use(
  require('hemera-ajv', {
    ajv: {
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: true
    }
  })
)
```

## Plugin decorators

* .addSchema(Object schema)
