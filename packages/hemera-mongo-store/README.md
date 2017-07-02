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

## Extended JSON
Because the underlying NATs transport is simply passing JSON stringified messages between actions, certain native (or extended) MongoDB types will be lost. For example, sending the following action will result in the `date` and `objectId` fields being saved as strings, not as their corresponding `Date` and `ObjectId` types.
```js
hemera.ready(() => {
  const ObjectID = hemera.exposition['hemera-mongo-store'].mongodb.ObjectID
  hemera.act({
    topic: 'mongo-store',
    cmd: 'create',
    collection: 'collTest',
    data: {
      name: 'peter',
      date: new Date(),
      objectId: new ObjectID(),
    }
  }, (err, resp) => {
    // The `date` and `objectId` values will be saved as strings in the database!
  })
})
```
In order to "fix" this issue, the `mongo-store` supports the use of [MongoDB Extended JSON](https://docs.mongodb.com/manual/reference/mongodb-extended-json/). For example:
```js
hemera.ready(() => {
  const ObjectID = hemera.exposition['hemera-mongo-store'].mongodb.ObjectID
  hemera.act({
    topic: 'mongo-store',
    cmd: 'create',
    collection: 'collTest',
    data: {
      name: 'peter',
      date: { $date: new Date() },
      objectId: { $oid: new ObjectID() },
    }
  }, (err, resp) => {
    // The data will now be persisted with the correct `Date` and `ObjectId` types.
  })
})
```
To make things easiser, you can also use the `mongodb-extended-json` [package](https://www.npmjs.com/package/mongodb-extended-json) and its serialization capabilities (which the store uses under the hood), to make the objects "less messy." For example:
```js
const EJSON = require('mongodb-extended-json');

hemera.ready(() => {
  const ObjectID = hemera.exposition['hemera-mongo-store'].mongodb.ObjectID
  hemera.act({
    topic: 'mongo-store',
    cmd: 'create',
    collection: 'collTest',
    data: EJSON.serialize({
      name: 'peter',
      date: new Date(),
      objectId: new ObjectID(),
    })
  }, (err, resp) => {
    // The data will now be persisted with the correct `Date` and `ObjectId` types.
  })
})
```

Be default, responses returned from the `mongo-store` (via `find` or other actions) will *not* return the document(s) in MongoDB extended JSON format. This was done for two reasons:
1. We wanted to avoid "forcing" users into dealing with `{ date: { $date: "2017-05..." } }` response formats (instead, you can simply re-init the date by running `new Date(resp.date)` when/if you need to)
2. We didn't want to enforce a hard dependency on the `mongodb-extended-json` package in your application code

That being said, if you want responses to be converted into extended format, you can enable the `serializeResult` plugin option. Also, to "auto-magically" convert all extended types, you can utilize mongodb-extended-json's deserialization capabilities. Example:
```js
const EJSON = require('mongodb-extended-json');

hemera.use(hemeraMongo, {
  serializeResult: true,
  mongo: {
    url: 'mongodb://localhost:27017/test'
  }
})

hemera.ready(() => {
  hemera.act({
    topic: 'mongo-store',
    cmd: 'findById',
    collection: 'collTest',
    id: 'some-id-value',
  }, function (err, resp) {
    const doc = EJSON.deserialize(resp);
    // Now `doc.date` and `doc.objectId` will be deserialized into
    // `Date` and `ObjectId` types, respectively.
  })
})
```
Finally, extended JSON can also be used in queries. This is useful when you need to query an `ObjectId` value that isn't the native `_id` field, or for Regular Expressions. For example:
```js
const EJSON = require('mongodb-extended-json');

hemera.ready(() => {
  hemera.act({
    topic: 'mongo-store',
    cmd: 'find',
    collection: 'collTest',
    query: EJSON.serialize({
      name: new RegExp(/^ja/, 'i')
    })
    // Without the EJSON library...
    // query: {
    //   name: { $regex: '^ja', $options: 'i' }
    // }
  }, function (err, resp) {

  })
})
```
