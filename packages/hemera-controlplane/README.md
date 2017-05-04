# Hemera-controlplane package

[![npm](https://img.shields.io/npm/v/hemera-controlplane.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-controlplane)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to scale your workers remotly with Hemera. This package allows you to react dynamically to load requirements. Each worker has its own memory, with their own V8 instance. If you scale a worker inside a docker container ensure that you docker host has enough memory. The maximal number of workers is restricted to the processor count of the host machine.

__Status:__ Experimental

#### 1. Start your worker

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const HemeraControlPlane = require('hemera-controlplane')
const HemeraJoi = require('hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.use(HemeraJoi)
hemera.use(HemeraControlPlane, {
  service: 'math'
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
})
```

#### 1. Scale your worker

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'scaleUp',
    service: 'math'
  }, (err, req) => {
    hemera.log.info(req, 'Result') // {"success":true,"pid":5500}
  })
})
```

#### 1. Scale your worker down

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'scaleDown',
    service: 'math'
  }, (err, req) => {
    hemera.log.info(req, 'Result') // {"success":true,"pid":5500}
  })
})
```

#### 3. Kill all workers but keep the parent process

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'down',
    service: 'math'
  }, (err, req) => {
    hemera.log.info(req, 'Result') // {"success":true}
  })
})
```

#### 3. Exit a worker by PID

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

hemera.ready(() => {
  hemera.act({
    topic: 'controlplane',
    cmd: 'exitByPid',
    service: 'math',
    pid: 1
  }, (err, req) => {
    hemera.log.info(req, 'Result') // {"success":true}
  })
})
```
