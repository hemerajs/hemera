---
id: version-5.0.0-payload-validation
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

We provide a method `setSchemaCompiler` which accepts a validation function. If you working with async validators you can return a promise as well.

```js
hemera.setSchemaCompiler(schema => pattern =>
  Joi.validate(pattern, schema.joi$ || schema, {
    allowUnknown: true
  })
)
```

## Response payload validation

With the help of the `onServerPreResponse` extension you can validate or change your response payload. In the packages [`hemera-joi`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi) or [`hemera-ajv`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-ajv) you can find useful examples.
