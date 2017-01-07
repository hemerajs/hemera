# Hemera-sql-store package

**Status**: In development

This is a plugin to use a SQL Database with Hemera.
This plugin is based on [Knex](http://knexjs.org/).

### Start Arangodb with Docker

```js
docker run -d --name mysql -p 3306:3306 dockerfile/mariadb
```

### Running the tests

Install and start Mariadb/Mysql before starting.

```
npm run test
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const knex = Knex({
  dialect: 'mysql' || 'pg' || 'pg-hstore',
  connection: {
    host: '127.0.0.1',
    user: '',
    password: '',
    database: testDatabase
  },
  pool: {
    min: 0,
    max: 7
  }
});

HemeraSql.options.knex = {
  driver: knex
}

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraSql)

hemera.ready(() => {

  const user = {
    name: 'olaf'
  }

  hemera.act({
    topic: 'sql-store',
    cmd: 'create',
    table: testTable,
    data: user
  }, (err, resp) => {

  })
})
```

## API

## Table of Contents

* [Store API](#Document-api)
  * [topic:sql-store,cmd:create](#create)
  * [topic:sql-store,cmd:update](#update)
  * [topic:sql-store,cmd:updateById](#updateById)
  * [topic:sql-store,cmd:find](#find)
  * [topic:sql-store,cmd:findById](#findById)
  * [topic:sql-store,cmd:remove](#remove)
  * [topic:sql-store,cmd:removeById](#removeById)
  * [topic:sql-store,cmd:replace](#replace)
  * [topic:sql-store,cmd:replaceById](#replaceById)
