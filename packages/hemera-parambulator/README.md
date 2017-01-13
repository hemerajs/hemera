# Hemera-parambulator package

[![npm](https://img.shields.io/npm/v/hemera-parambulator.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-parambulator)

This is a plugin to use [Parambulator](https://github.com/rjrodger/parambulator) with Hemera.

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
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
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
