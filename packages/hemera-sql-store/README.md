# Hemera-sql-store package

[![npm](https://img.shields.io/npm/v/hemera-sql-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sql-store)

**Status**: In development

This is a plugin to use a SQL Database with Hemera.
This plugin is based on [Knex](http://knexjs.org/).

It can handle following dialects

- pg
- mysql
- mariasql
- mssql
- mysql2
- strong-oracle
- sqlite3
- oracle

Mysql and postgresql driver are preinstalled. If you need a different you can install it easily with
```
npm install --save <driver>
```

### Start Mariadb with Docker

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
