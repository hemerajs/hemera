# Hemera-sql-store package

[![npm](https://img.shields.io/npm/v/hemera-sql-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sql-store)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

**Status**: _In development_

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

```
cd test && docker-compose up
```

### Running the tests

```
npm run test
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const HemeraJoi = require('hemera-joi')
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
})

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(HemeraSql, {
  knex: {
    driver: knex
  }
})

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

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.
