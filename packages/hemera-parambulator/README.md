# Hemera-parambulator package

[![npm](https://img.shields.io/npm/v/hemera-parambulator.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-parambulator)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Parambulator](https://github.com/rjrodger/parambulator) with Hemera.

_We prefer to use [Joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi) as a payload validator. The status quo of payload validation in NodeJs._

#### Example

```js
const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(require('hemera-parambulator'))

hemera.ready(() => {

  // Use Parambulator as payload validator
  hemera.setOption('payloadValidator', 'hemera-parambulator')

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  }, (req, cb) => {

    cb(null, req.a + req.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 'dwed3',
    b: 20
  }, function (err, resp) {

    this.log.info('Error', err)
  })
})
```

#### Pass the full schema

```js
  hemera.add({
    topic: 'email',
    cmd: 'send',
    pb$: {
      a: {
        type$: 'number'
      }
    }
  }, (resp, cb) => {

  })
```
