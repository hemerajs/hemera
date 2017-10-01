# Hemera-joi package

[![npm](https://img.shields.io/npm/v/hemera-joi.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-joi)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Joi](https://github.com/hapijs/joi) with Hemera.

#### Example
```js
const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(require('hemera-joi'))

hemera.ready(() => {

  // Use Joi as payload validator
  hemera.setOption('payloadValidator', 'hemera-joi')

  let Joi = hemera.exposition['hemera-joi'].joi
  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required()
  }, (req, cb) => {

    cb(null, req.a + req.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 'dwed3',
    b: 20
  }, function (err, resp) {

    this.log.info('Error', err.cause.message) //Error child "a" fails because ["a" must be a number]
  })
})
```

### Pass the full schema
```js
  let Joi = hemera.exposition['hemera-joi'].joi
  
  hemera.add({
    topic: 'math',
    cmd: 'add',
    joi$: Joi.object().keys({ a: Joi.number().required() })
  }, (req, cb) => {

    cb(null, req.a + req.b)
  })
```

### Pre and Post validation
```js
  let Joi = hemera.exposition['hemera-joi'].joi
  
  hemera.add({
    topic: 'math',
    cmd: 'add',
    joi$: {
      pre: {
        a: Joi.number().required()
      },
      post: {
        foo: Joi.number().default(500)
      }
    }
  }, (req, cb) => {

    cb(null, { result: req.a + req.b })
  })

  // response will be { result: <number>, foo: 500 }
```


