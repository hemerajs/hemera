# Hemera-mongo-store package

[![npm](https://img.shields.io/npm/v/hemera-mongo-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mongo-store)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [Mongodb](https://www.mongodb.com/) with Hemera.

## Start Mongodb with Docker

```js
docker run -d -p 27017:27017 -p 28017:28017 -e AUTH=no tutum/mongodb
```

### Running the tests

```
npm install
npm run test
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraMongo = require('hemera-mongo-store')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraMongo, {
  mongo: {
    url: 'mongodb://localhost:27017/test'
  }
})

hemera.ready(() => {
  hemera.act({
    topic: 'mongo-store',
    cmd: 'create',
    collection: 'collTest',
    data: {
      name: 'peter'
    }
  }, function (err, resp) {
    this.log.info(resp, 'Query result')
  })
})

```

## API

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.
