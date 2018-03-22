---
id: version-5.0.0-rc.4-payload-validation
title: Payload validation
sidebar_label: Payload validation
original_id: payload-validation
---

You can use different validators in Hemera. A very popular and easy readable validator is [hemera-joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi).

## Joi validator

```js
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

## Error handling

We expect a number instead a string.

```js
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: '1'
  },
  function(err, resp) {}
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
