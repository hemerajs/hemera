# Hemera-joi package

[![npm](https://img.shields.io/npm/v/hemera-joi.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-joi)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Joi](https://github.com/hapijs/joi) for request/response validation.

## Usage

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-joi'))
```

## Request validation

The primary purpose of joi is to validate the incoming request. You can define your validation schema with the `joi$` property or inline.

```js
let Joi = hemera.joi

// inline
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required()
  },
  (req, cb) => {
    cb(null, req.a + req.b)
  }
)

// with `joi$` property
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    joi$: Joi.object().keys({ a: Joi.number().required() })
  },
  (req, cb) => {
    cb(null, req.a + req.b)
  }
)
```

## Response validation

You can validate the response payload as well if you use the `postJoi$` property. Response error isn't validated but must be from type `Error`.

### Missing fields

If a field is present in the schema (and is not required) but it is not present in the object to validate, joi will not write it in the final payload.

```js
let Joi = hemera.joi

hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    preJoi$: {
      a: Joi.number().required()
    },
    postJoi$: {
      foo: Joi.number().default(500)
    }
  },
  (req, cb) => {
    cb(null, { foo: req.a + req.b })
  }
)
```

## Change Joi settings

You can modify the joi validation settings with the `pre` and `post` plugin options.

```js
const hemera = new Hemera(nats)
hemera.use(
  require('hemera-joi', {
    patternKeys: {
      default: 'joi$',
      pre: 'preJoi$',
      post: 'postJoi$'
    },
    // joi settings
    pre: { allowUnknown: true },
    post: { stripUnknown: true }
  })
)
```

## Plugin decorators

* .joi
