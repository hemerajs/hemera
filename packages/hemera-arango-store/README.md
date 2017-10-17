# :avocado: Hemera-arango-store package

[![npm](https://img.shields.io/npm/v/hemera-arango-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-arango-store)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Arangodb](https://github.com/arangodb) with Hemera.

Execute any AQL query from anywhere. For more details [ArangoDB Query Language](https://www.arangodb.com/why-arangodb/sql-aql-comparison/)

## Start Arangodb with Docker

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

## Install

```
npm i hemera-arango-store --save
```

## Usage

```js
const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const nats = require('nats').connect()
const HemeraArango = require('hemera-arango-store')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(HemeraArango, {
  arango: {
    url: 'http://127.0.0.1:8529',
    databaseName: 'test'
  }
})

// arangojs driver
hemera.arango
// create aql queries
hemera.aqlTemplate
```

#### Dependencies
- hemera-joi

## API

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.

## Database specific interface

* [Arango API](#arango-api)
  * [Collection API](#collection-api)
    * [createCollection](#createcollection)
  * [Query API](#query-api)
    * [executeAqlQuery](#executeaqlquery)
  * [Transaction API](#transaction-api)
    * [executeTransaction](#executetransaction)
  * [Database API](#database-api)
    * [createDatabase](#createdatabase)
  
 
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
* `type`: return one or multiple results `one` or `all`

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
