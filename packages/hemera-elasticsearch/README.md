# Hemera-elasticsearch package

[![npm](https://img.shields.io/npm/v/hemera-elasticsearch.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-elasticsearch)

**Status**: In development

This is a plugin to use Elasticsearch with Hemera.
This plugin is based on the official driver [elasticsearch](https://github.com/elastic/elasticsearch-js).

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraElasticsearch = require('hemera-elasticsearch')

// configure your client
hemeraElasticsearch.options.elasticsearch = ....

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
