# Hemera-arango-store package

This is a plugin to use [Arangodb](https://github.com/arangodb) with Hemera.

Execute any AQL query from anywhere. For more details [ArangoDB Query Language](https://www.arangodb.com/why-arangodb/sql-aql-comparison/)

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
  
  // return all users
  hemera.act({
    topic: 'arango-store',
    cmd: 'aql',
    type: 'all',
    query: `
    FOR u IN users
    RETURN u
`
  }, function (err, resp) {

    this.log.info(resp, 'Query result')
  })

  // create new user from plain JSON
  hemera.act({
    topic: 'arango-store',
    cmd: 'aql',
    type: 'one',
    variables: {
      user: {
        name: 'olaf'
      }
    },
    query: `INSERT @user INTO users`
  }, function (err, resp) {

    this.log.info(resp, 'Query result')
  })

})
```

## API

#### topic:arango-store,cmd:aql,type:one

 Execute AQL Query and return the first result

**Arguments**

* **variables**: `object` (Default: `undefined`)

  The template variables for your AQL query.

* **query**: `string` (Default: `""`)

  Your AQL query


#### topic:arango-store,cmd:aql,type:all

 Execute AQL Query and return all matched results

**Arguments**

* **variables**: `object` (Default: `undefined`)

  The template variables for your AQL query.

* **query**: `string` (Default: `""`)

  Your AQL query
