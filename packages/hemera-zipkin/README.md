# Hemera-zipkin package

[![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [Zipkin](http://zipkin.io/) with Hemera.

#### 1. Run zipkin in docker container

```js
docker run -d -p 9411:9411 openzipkin/zipkin
```
#### 2. Visit http://127.0.0.1:9411/

#### 3. Run example

```js
'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()
const hemeraZipkin = require('hemera-zipkin')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraZipkin, {
  host: '192.168.99.100'
})

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'auth',
    cmd: 'signup',
  }, function (req, cb) {

    let userId = 1

    //Visible in zipkin ui
    this.delegate$.query = 'SELECT FROM User;'

    this.act({
      topic: 'email',
      cmd: 'send',
      email: req.email,
      message: 'Welcome!'
    }, function (err, resp) {

      this.act({
        topic: 'payment',
        cmd: 'process',
        userId: userId
      }, function (err, resp) {

        cb(null, true)
      })
    })

  })

  hemera.add({
    topic: 'payment',
    cmd: 'process'
  }, function (req, cb) {

    cb(null, true)
  })

  hemera.add({
    topic: 'email',
    cmd: 'send'
  }, function (req, cb) {

    cb(null, true)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'auth',
    cmd: 'signup',
    email: 'peter@gmail.com',
    password: '1234'
  }, function (err, resp) {

    this.log.info('Finished', resp)
  })
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
