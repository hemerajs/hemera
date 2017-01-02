# Hemera-arango-store package

This is a plugin to use [Arangodb](https://github.com/arangodb) with Hemera.

Execute any AQL query from anywhere. For more details [ArangoDB Query Language](https://www.arangodb.com/why-arangodb/sql-aql-comparison/)

### Start Arangodb with Docker

`docker run -e ARANGO_NO_AUTH=1 -d --name arangodb-instance -d arangodb -p 8529:8529`

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraArango = require('hemera-arango-store')
hemeraArango.options.arango = {
  url: 'http://192.168.99.100:8529',
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

## API

#### topic:arango-store,cmd:executeAqlQuery,type:one

 Execute AQL Query and return the first result

**Arguments**

* **variables**: `object` (Default: `undefined`)

  The template variables for your AQL query.

* **databaseName**: `string` (Default: `""`)

  The database to use against the query.

* **query**: `string` (Default: `""`)

  Your AQL query


#### topic:arango-store,cmd:executeAqlQuery,type:all

 Execute AQL Query and return all matched results

**Arguments**

* **variables**: `object` (Default: `undefined`)

  The template variables for your AQL query.

* **databaseName**: `string` (Default: `""`)

  The database to use against the query.

* **query**: `string` (Default: `""`)

  Your AQL query


#### topic:arango-store,cmd:createCollection

Create a new collection

**Arguments**

* **type**: `string` (Default: `""`)

  The type of collection to create. `edge` or default.

* **databaseName**: `string` (Default: `""`)

  The database to use against the query.

#### topic:arango-store,cmd:createDatabase

Create a new database

**Arguments**

* **name**: `string`

  The name of the database

* **users**: `Array<Object>` (optional)

  If specified, the array must contain objects with the following properties:

  * **username**: `string`

    The username of the user to create for the database.

  * **passwd**: `string` (Default: empty)

    The password of the user.

  * **active**: `boolean` (Default: `true`)

    Whether the user is active.

  * **extra**: `Object` (optional)

    An object containing additional user data.
