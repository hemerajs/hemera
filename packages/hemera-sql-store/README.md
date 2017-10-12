# Hemera-sql-store package

[![npm](https://img.shields.io/npm/v/hemera-sql-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sql-store)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use a SQL Database with Hemera.
This plugin is based on [Knex](http://knexjs.org/).

## Install

```
npm i hemera-sql-store --save
```

## Start Mariadb with Docker

```
docker-compose up
```

## Running the tests

```
npm run test
```

## Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const HemeraJoi = require('hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(HemeraSql, {
  knex: {
    dialect: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: '',
      password: '',
      database: 'test'
    },
    pool: {
      min: 0,
      max: 7
    }
  }
})

// get the knex instance of a different database
hemera.sqlStore.useDb('test2')
```

## API

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.

## Caveats

- Mysql and postgresql driver are preinstalled. If you need a different you can install it easily with `npm install --save <driver>`
