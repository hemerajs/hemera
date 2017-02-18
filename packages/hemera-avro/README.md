# Hemera-avro package

[![npm](https://img.shields.io/npm/v/hemera-avro.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-avro)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [Avro](https://avro.apache.org) with Hemera.

Apache Avro™ is a data serialization system.

#### Example without payload schema (Only the protocol schema will be checked with Avro)

```js
'use strict'

const Hemera = require('nats-hemera')
// Use NATS driver >= 0.7.2
const nats = require('nats').connect({ 
  // otherwise NATS will interpret all data as LATIN1 (binary encoding)
  preserveBuffers: true
})
const HemeraAvro = require('hemera-avro')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraAvro)

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {

    cb(null, req.a + req.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }, function (err, resp) {

    this.log.info('Result', resp)
  })
})

```

#### Example with payload schema

```js
hemera.ready(() => {

  let Avro = hemera.exposition['hemera-avro'].avro

  const type = Avro.parse({
  name: 'Person',
  type: 'record',
  fields: [{
      name: 'a',
      type: 'int'
    }]
  })

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'peopleDirectory',
    cmd: 'create',
    avro$: type // how to encode the request
  }, (req, cb) => {

    cb(null, { a: 1 })
  })

  hemera.act({
    topic: 'peopleDirectory',
    cmd: 'create',
    name: 'peter',
    avro$: type // how to decode the response
  }, function (err, resp) {

    this.log.info('Result', resp)
  })
})
```
