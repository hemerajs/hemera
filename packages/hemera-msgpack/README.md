# Hemera-msgpack package

[![npm](https://img.shields.io/npm/v/hemera-msgpack.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-msgpack)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Mspack](http://msgpack.org/index.html) with Hemera.

MessagePack is an efficient binary serialization format. It lets you exchange data among multiple languages like JSON. But it's faster and smaller. Small integers are encoded into a single byte, and typical short strings require only one extra byte in addition to the strings themselves.

## Example

```js
const Hemera = require('nats-hemera')
// Use NATS driver >= 0.7.2
const nats = require('nats').connect({
  preserveBuffers: true
})
const HemeraMsgpack = require('hemera-msgpack')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})
```
