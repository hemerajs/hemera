# Hemera-avro package

[![npm](https://img.shields.io/npm/v/hemera-avro.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-avro)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Avro](https://avro.apache.org) with Hemera.

Apache Avro™ is a data serialization system.

### Features

- No schema for you pattern is required
- The request and response schema of a server method (`add`) is validated by Avro™
- Flexible base schema
- Easy to start

#### Example without payload schema

Only the protocol schema will be validated with Avro

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

  hemera.add({
    topic: 'peopleDirectory',
    cmd: 'create',
    avro$: type // We know how to encode the request
  }, (req, cb) => {

    cb(null, { a: 1 })
  })

  hemera.act({
    topic: 'peopleDirectory',
    cmd: 'create',
    name: 'peter',
    avro$: type // We know how to decode the response
  }, function (err, resp) {

    this.log.info('Result', resp)
  })
})
```

### Use [Type inference](https://github.com/mtth/avsc/wiki/Advanced-usage#type-inference) to auto-generate your schema

```js
const type = avro.Type.forValue([1, 4.5, 8])
// We can now encode or any array of floats using this type:
const buf = type.toBuffer([4, 6.1])
const val = type.fromBuffer(buf) // [4, 6.1]
// We can also access the auto-generated schema:
const schema = type.schema()
const JSON = JSON.stringify(schema) // Copy & Paste
```

### Base Schema

The pattern is encoded to JSON byte-array when it's from type `object` or `array`. Primitive values (boolean, strings, numbers) are encoded with Avro.
The error, delegate, meta and request data are predefined with a fixed schema. Here a list of the specification.

- **delegate:** Can be a Map of strings, boolean, number
- **meta:** Can be a Map of strings, boolean, number
- **result:** You can use your own schema. If you don't define it the message is interpreted as binary (JSON encoded schema-less)
- **error:**
  - **name:** Name of the error
  - **message:** Message of the error
  - **stack:** Stack of the error
  - **code:** Code of the error
  - **statusCode:** Code of the error when using hemera-web
  - **details:** Can be a Map of strings, boolean, number to add additional data
  - **hops:** An array of services which were involved in this request
