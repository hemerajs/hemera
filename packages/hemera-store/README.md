# Hemera-store package

[![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Simple API to be interoperable with most database interfaces.

# Interface

* [Store API](#store-api)
  * [create](#create)
  * [update](#update)
  * [updateById](#updatebyid)
  * [find](#find)
  * [findById](#findbyid)
  * [remove](#remove)
  * [removeById](#removebyid)
  * [replace](#replace)
  * [replaceById](#replacebyid)
  * [exists](#exists)
  * [count](#count)

Provide a unique pattern set for all common api methods. We had to choose for some conventions across document and table oriented stores.

Table-oriented | Document-oriented | Convention
--- | --- | ---
Database | Database | **Database**
Database | Collection | **Collection**


-------------------------------------------------------
### create

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `data`: the data which represent the entity to create `object` or `Array<object>`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'create',
  collection: 'product',
  data: {
    name: 'tomato'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### update

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `data`: the data which represent the entity to create `object`
* `query`: the search criteria `object`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'update',
  collection: 'product',
  query: {},
  data: {
    name: 'tomato'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### updateById

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `data`: the data which represent the entity to create `object`
* `id`: the primary identifier of your entity `string` or `number`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'updateById',
  id: 1,
  collection: 'product',
  data: {
    name: 'tomato'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### find

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `query`: the search criteria `object`
* `options`: the search criteria `object` (*optional*)
  * `limit`: maximum items to fetch `integer`
  * `offset`: the offset `integer`
  * `orderBy`: the offset `array<string>` or `string` or `map<string, int>`
  * `fields`: the projection settings `array<string>` or `map<string, int>`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'find',
  collection: 'product',
  query: {}
}, function(err, resp) ...)
```

-------------------------------------------------------
### findById

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `id`: the primary identifier of your entity `string` or `number`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'updateById',
  id: 1,
  collection: 'product'
}, function(err, resp) ...)
```

-------------------------------------------------------
### remove

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `query`: the search criteria `object`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'remove',
  collection: 'product',
  query: {}
}, function(err, resp) ...)
```

-------------------------------------------------------
### removeById

The pattern is:

* `topic`: is the topic to publish to `sql-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `id`: the primary identifier of your entity `string` or `number`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'removeById',
  id: 1,
  collection: 'product'
}, function(err, resp) ...)
```

-------------------------------------------------------
### replace

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `data`: the data which represent the entity to create `object`
* `query`: the search criteria `object`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'replace',
  collection: 'product',
  query: {},
  data: {
    name: 'tomato'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### replaceById

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `data`: the data which represent the entity to create `object`
* `id`: the primary identifier of your entity `string` or `number`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'replaceById',
  id: 1,
  collection: 'product',
  data: {
    name: 'tomato'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### exists

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `create`
* `collection`: the name of the table or collection `string`
* `query`: the search criteria `object`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'exists',
  collection: 'product',
  query: {}
}, function(err, resp) ...)
```

-------------------------------------------------------
### count

The pattern is:

* `topic`: is the store name to publish to `<name>-store`
* `cmd`: is the command to execute `count`
* `collection`: the name of the table or collection `string`
* `query`: the search criteria `object`

Example:
```js
hemera.act({
  topic: 'sql-store',
  cmd: 'count',
  collection: 'product',
  query: {}
}, function(err, resp) ...)
```

