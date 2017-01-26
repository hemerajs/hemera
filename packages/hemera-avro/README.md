# Hemera-avro package

[![npm](https://img.shields.io/npm/v/hemera-avro.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-avro)

This is a plugin to use [Avro](https://avro.apache.org) with Hemera.

Apache Avro™ is a data serialization system.

Avro provides:

* Rich data structures.
* A compact, fast, binary data format.
* A container file, to store persistent data.
* Remote procedure call (RPC).
* Simple integration with dynamic languages. Code generation is not required to read or write data files nor to use or implement RPC protocols. Code generation as an optional optimization, only worth implementing for statically typed languages.

### Comparison with other systems
Avro provides functionality similar to systems such as Thrift, Protocol Buffers, etc. Avro differs from these systems in the following fundamental aspects.

Dynamic typing: Avro does not require that code be generated. Data is always accompanied by a schema that permits full processing of that data without code generation, static datatypes, etc. This facilitates construction of generic data-processing systems and languages.
Untagged data: Since the schema is present when data is read, considerably less type information need be encoded with data, resulting in smaller serialization size.No manually-assigned field IDs: When a schema changes, both the old and new schema are always present when processing data, so differences may be resolved symbolically, using field names.

### Implementation details:

All data is transfered in the corresponding type except the payload. If you transfer a complex type like an object it is packed in a buffer and encoded/decoded to JSON. Primitive values are avro specific transfered. You can also define the schema of the payload see example 2.


#### Example without payload schema

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
// include only serialization support
const Avro = require('avsc/etc/browser/avsc-protocols')
const type = Avro.parse({
  name: 'Person',
  type: 'record',
  fields: [{
    name: 'a',
    type: 'int'
  }]
})

hemera.ready(() => {

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
