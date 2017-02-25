# Hemera-elasticsearch package

[![npm](https://img.shields.io/npm/v/hemera-elasticsearch.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-elasticsearch)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

**Status**: _In development_

This is a plugin to use Elasticsearch with Hemera.
This plugin is based on the official driver [elasticsearch](https://github.com/elastic/elasticsearch-js).

## Start elastisearch via docker

```
docker run -p 9200:9200 -e "http.host=0.0.0.0" -e "transport.host=127.0.0.1" docker.elastic.co/elasticsearch/elasticsearch:5.2.1
```

## Interface
Visit http://127.0.0.1:9200
```
Username: elastic
Password: changeme
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraElasticsearch = require('hemera-elasticsearch')

// configure your client
hemeraElasticsearch.options.elasticsearch.log = 'trace'
hemeraElasticsearch.options.elasticsearch.httpAuth = 'elastic:changeme'

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(hemeraElasticsearch)

hemera.ready(() => {

  hemera.act({
    topic: 'elasticsearch',
    cmd: 'create',
    data: {
      index: 'myindex',
      type: 'mytype',
      id: '3',
      body: {
        title: 'Test 1',
        tags: ['y', 'z'],
        published: true,
        published_at: '2013-01-01',
        counter: 1
      }
    }
  }, function (err, req) {

    this.log.info(req, 'Data')

  })

  hemera.act({
    topic: 'elasticsearch',
    cmd: 'search',
    data: {
      index: 'myindex',
      q: 'title:test'
    }
  }, function (err, req) {

    this.log.info(req, 'Data')

  })

})
```

## Interface

* [Elasticsearch API](#elasticsearch-api)
  * [search](#search)
  * [create](#create)
  * [delete](#delete)
  * [count](#count)
  * [bulk](#bulk)
  * [refresh](#refresh)
  
 
-------------------------------------------------------
### search

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `search`
* `data`: the name of the table or collection `string
  * `index`: the name of your index `string`
  * `body`: the search criteria `object` *(optional)*
  * `q`: the search criteria `object` *(optional)*

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'search',
  data: {
    index: 'myindex',
    q: 'title:test'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### create

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `create`
* `data`: options see [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-create)

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'create',
  data: {
    index: 'myindex',
    type: 'mytype',
    id: '1',
    body: {
      title: 'Test 1',
      tags: ['y', 'z'],
      published: true,
      published_at: '2013-01-01',
      counter: 1
    }
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### delete

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `delete`
* `data`: options see [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-delete)

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'delete',
  data: {
    index: 'myindex',
    type: 'mytype',
    id: '1'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### count

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `count`
* `data`: options see [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-count)

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'count',
  data: {
    index: 'myindex'
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### bulk

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `bulk`
* `data`: options see [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk)

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'bulk',
  data: {
    body: [
        // action description
        { index:  { _index: 'myindex', _type: 'mytype', _id: 1 } },
         // the document to index
        { title: 'foo' },
        // action description
        { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
        // the document to update
        { doc: { title: 'foo' } },
        // action description
        { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
        // no document needed for this delete
      ]
  }
}, function(err, resp) ...)
```

-------------------------------------------------------
### refresh

The pattern is:

* `topic`: is the service name to publish to `elasticsearch`
* `cmd`: is the command to execute `refresh`
* `data`: options see [elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-indices-refresh)

Example:
```js
hemera.act({
  topic: 'elasticsearch',
  cmd: 'refresh',
  data: {
    index: 'myindex'
  }
}, function(err, resp) ...)
```
