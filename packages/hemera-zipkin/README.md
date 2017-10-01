# Hemera-zipkin package

[![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Zipkin](http://zipkin.io/) with Hemera.

<p align="center">
<img src="https://github.com/hemerajs/hemera/blob/master/packages/hemera-zipkin/media/zipkin-dependency-graph.PNG" style="max-width:100%;">
</p>

## Tracking level

1. Per subscription: Each topic represents a subscription in NATS and therefore handled as own service. The hemera `tag` indentifiy the server instance.
2. Per hemera instance: Each hemera instance represents the whole service. The service name can be configured by the `tag` option.

#### 1. Run zipkin in docker container
```
$ docker-compose up
```
#### 2. Visit http://127.0.0.1:9411/

#### 3. Run example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraZipkin = require('hemera-zipkin')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true,
  tag: 'user-service'
})

hemera.use(hemeraZipkin, {
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans',
  subscriptionBased: true, // when false the hemera tag represents the service otherwise the NATS topic name
  sampling: 1
})

hemera.ready(() => {
  hemera.add({
    topic: 'email',
    cmd: 'send'
  }, function (req, cb) {
    cb(null, true)
  })

  hemera.add({
    topic: 'profile',
    cmd: 'get'
  }, function (req, cb) {
    this.delegate$.query = 'SELECT FROM User;'
    cb(null, true)
  })

  hemera.add({
    topic: 'auth',
    cmd: 'login'
  }, function (req, cb) {
    this.act('topic:profile,cmd:get', function () {
      this.act('topic:email,cmd:send', cb)
    })
  })
  hemera.act('topic:auth,cmd:login')
})
```

#### 4. Refresh Zipkin Dashboard

## Binary annotations

You can easily provide extra information about the RPC if you use the special delegate$ variable.

```js
hemera.act({
    topic: 'auth',
    cmd: 'signup',
    email: 'peter@gmail.com',
    password: '1234',
    
    delegate$: { foo: 'bar' } // only primitive values
}, function (err, resp) {

  this.log.info('Finished', resp)
})
```

### Credits

[Zipkin Simple](https://github.com/paolochiodi/zipkin-simple)
