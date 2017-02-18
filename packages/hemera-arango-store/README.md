# Hemera-arango-store package

[![npm](https://img.shields.io/npm/v/hemera-arango-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-arango-store)

This is a plugin to use [Arangodb](https://github.com/arangodb) with Hemera.

Execute any AQL query from anywhere. For more details [ArangoDB Query Language](https://www.arangodb.com/why-arangodb/sql-aql-comparison/)

### Start Arangodb with Docker

```js
docker run -e ARANGO_NO_AUTH=1 -d --name arangodb-instance -d arangodb -p 8529:8529
```

### Running the tests

Install and start Arangodb before starting.

**arangod.conf**
```
endpoint = tcp://127.0.0.1:8529
authentication = false
```

```
npm run test
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraArango = require('hemera-arango-store')
hemeraArango.options.arango = {
  url: 'http://127.0.0.1:8529',
  databaseName: 'test'
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraArango)

hemera.ready(() => {

  let aql = hemera.exposition['hemera-arango-store'].aqlTemplate

  hemera.act({
    topic: 'arango-store',
    cmd: 'executeAqlQuery',
    type: 'all',
    query: `
    FOR u IN users
    RETURN u
`
  }, function (err, resp) {

    this.log.info(resp, 'Query result')
  })

  const user = {
    name: 'olaf'
  }

  hemera.act({
    topic: 'arango-store',
    cmd: 'executeAqlQuery',
    type: 'one',
    query: aql`INSERT ${user} INTO users`
  }, function (err, resp) {

    this.log.info(resp, 'Query result')
  })

})
```

## Usage

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.

## Database specific interface

* [Arango API](#couchbase-api)
  * [Collection API](#collection-api)
    * [topic:arango-store,cmd:createCollection](#createcollection)
  * [Query API](#query-api)
    * [executeAqlQuery](#executeaqlquery)
  * [Transaction API](#transaction-api)
    * [topic:arango-store,cmd:executeTransaction](#executetransaction)
  * [Database API](#database-api)
    * [topic:arango-store,cmd:createDatabase](#createdatabase)
  
 
-------------------------------------------------------
### createCollection

The pattern is:

* `topic`: is the store name to publish to `arango-store`
* `cmd`: is the command to execute `createCollection`
* `name`: the name of the collection `string`
* `databaseName`: the database to use against the query. `string` *(optional)*
* `type`: the type of collection to create `edge` or `""` *(optional)*

Example:
```js
hemera.act({
  topic: 'arango-store',
  cmd: 'createCollection',
  name: 'products'
}, function(err, resp) ...)
```

-------------------------------------------------------
### executeAqlQuery

The pattern is:

* `topic`: is the store name to publish to `arango-store`
* `cmd`: is the command to execute `executeAqlQuery`
* `databaseName`: the database to use against the query. `string` *(optional)*
* `query`: the AQL query `string`
* `type`: return one or multiple results` `one` or `all`

Example:
```js
hemera.act({
  topic: 'arango-store',
  cmd: 'executeAqlQuery',
  type: 'one',
  databaseName: testDatabase,
  query: aql `INSERT ${user} INTO testColl return NEW`
},
function(err, resp) ...)
```

-------------------------------------------------------
### executeTransaction

The pattern is:

* `topic`: is the store name to publish to `arango-store`
* `cmd`: is the command to execute `executeTransaction`
* `databaseName`: the database to use against the query. `string` *(optional)*
* `action`: a string evaluating to a JavaScript function to be executed on the server. `string`
* `params`: available as variable `params` when the *action* function is being executed on server. Check the example below. `object`
* `collection`: If *collections* is an array or string, it will be treated as *collections.write*. `object` *(optional)*
  * `read`: an array of names (or a single name) of collections that will be read from during the transaction. `Array<string>` *(optional)*
  * `write`: an array of names (or a single name) of collections that will be written from during the transaction. `Array<string>` *(optional)*
* `lockTimeout`: determines how long the database will wait while attemping to gain locks on collections used by the transaction before timing out.
 `integer`
  
Example:
```js
var action = String(function () {
  return true
})

hemera.act({
  topic: 'arango-store',
  cmd: 'executeTransaction',
  databaseName: testDatabase,
  action,
  params: {
    age: 12
  },
  collections: {
    read: 'users'
  }
},
function(err, resp) ...)
```

-------------------------------------------------------
### createDatabase

The pattern is:

* `topic`: is the store name to publish to `arango-store`
* `cmd`: is the command to execute `executeAqlQuery`
* `name`: the name of the database. `string`

Example:
```js
hemera.act({
  topic: 'arango-store',
  cmd: 'createDatabase',
  name: 'test'
},
function(err, resp) ...)
```
