'use strict'

const Hp = require('hemera-plugin')
const Elasticsearch = require('elasticsearch')

function hemeraElasticSearch(hemera, opts, done) {
  const topic = 'elasticsearch'
  const Joi = hemera.joi

  const client = new Elasticsearch.Client(opts.elasticsearch)
  hemera.decorate('elasticsearch', client)

  /**
   * Check if cluster is available otherwise exit this client.
   */
  client.ping(
    {
      requestTimeout: opts.elasticsearch.timeout
    },
    function(error) {
      if (error) {
        hemera.log.trace(error, 'elasticsearch cluster is down!')
        hemera.fatal()
      } else {
        hemera.log.info('elasticsearch cluster is available')
        done()
      }
    }
  )

  /**
   * Elasticsearch 5.0 API
   * - create
   * - delete
   * - search
   * - count
   * - refresh
   * - bulk
   */

  hemera.add(
    {
      topic,
      cmd: 'search',
      data: Joi.object().keys({
        index: Joi.string().required(),
        body: Joi.object().optional()
      })
    },
    function(req, cb) {
      client.search(req.data, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'create',
      data: Joi.object().keys({
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        body: Joi.object().required()
      })
    },
    function(req, cb) {
      client.create(req.data, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'delete',
      data: Joi.object().keys({
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        ignore: Joi.array()
          .default([404])
          .optional()
      })
    },
    function(req, cb) {
      client.delete(req.data, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'count',
      data: Joi.object().keys({
        index: Joi.string().required()
      })
    },
    function(req, cb) {
      client.count(req.data, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'bulk',
      data: Joi.object().keys({
        body: Joi.object().required()
      })
    },
    function(req, cb) {
      client.bulk(req.data, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'refresh',
      data: Joi.object().keys({
        index: Joi.array()
          .items(Joi.string())
          .required(),
        body: Joi.object().required()
      })
    },
    function(req, cb) {
      client.refresh(req.data, cb)
    }
  )
}

const plugin = Hp(hemeraElasticSearch, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  elasticsearch: {
    timeout: 3000,
    host: 'localhost:9200',
    apiVersion: '5.0'
  }
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
