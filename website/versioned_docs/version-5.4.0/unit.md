---
id: version-5.4.0-unit
title: Unit-test
sidebar_label: Unit
original_id: unit
---

We provide a simple package called [hemera-testsuite](https://github.com/hemerajs/hemera-testsuite) to emulate a limited feature-set of a real NATS Server in-memory.

### Features

* Support of wildcard `*` and `>` subjects
* Support for `maxMessages$`, `expectedMessages$` options
* Support for request & publish
* Support for timeouts

### Not supported\*

* Custom queue groups
* Special one-to-one publish
* Load balancing
* Connection related states

\*_In this case we recommend to start a real NATS Server._

```js
const Hemera = require('nats-hemera')
const Nats = require('hemera-testsuite/nats')
const nats = new Nats()
const hemera = new Hemera(nats)

hemera.ready(function() {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )
  hemera.act(
    {
      topic: math,
      cmd: add,
      a: 1,
      b: 2
    },
    (err, resp) => {
      console.log(err, resp)
    }
  )
})
```
