# Hemera-arango-store package

This is a plugin to use [Mspack](http://msgpack.org/index.html) with Hemera.

MessagePack is an efficient binary serialization format. It lets you exchange data among multiple languages like JSON. But it's faster and smaller. Small integers are encoded into a single byte, and typical short strings require only one extra byte in addition to the strings themselves.


#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const HemeraMsgpack = require('hemera-msgpack')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraMsgpack)

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
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
