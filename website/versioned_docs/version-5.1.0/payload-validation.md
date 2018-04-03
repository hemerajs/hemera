---
id: version-5.1.0-payload-validation
title: Payload validation
sidebar_label: Payload validation
original_id: payload-validation
---

You can use different validators in Hemera. A very popular and easy readable validator is [Joi](https://github.com/hapijs/joi).
Just install the [`hemera-joi`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi) package.

## Joi validator

```js
const Joi = hemera.joi
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required(),
    b: Joi.number().required()
  },
  function(req, cb) {
    cb(null, req.a + req.b)
  }
)
```

## JSON Schema

You can also use [JSON-Schema](http://json-schema.org/). Just install the [`hemera-ajv`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-ajv) package.

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

## Use your custom validator

We provide two methods `setSchemaCompiler` and `setResponseSchemaCompiler` which accepts a validation function. If you working with async validators you can return a promise as well.

```js
hemera.setSchemaCompiler(schema => pattern =>
  return {
    error: new Error('invalid request payload')
  }
)
hemera.setResponseSchemaCompiler(schema => payload =>
  return {
    error: new Error('invalid response payload')
  }
)
```
