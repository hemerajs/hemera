'use strict'

const Elasticsearch = require('elasticsearch')

exports.plugin = function hemeraElasticSearch (options, next) {
  const hemera = this
  const topic = 'elasticsearch'
  const Joi = hemera.exposition['hemera-joi'].joi

  const client = new Elasticsearch.Client(options.elasticsearch)

  /**
   * Check if cluster is available otherwise exit this client.
   */
  client.ping({
    requestTimeout: options.elasticsearch.timeout
  }, function (error) {
    if (error) {
      hemera.log.trace(error, 'elasticsearch cluster is down!')
      hemera.fatal()
    } else {
      hemera.expose('client', client)
      hemera.log.info('elasticsearch cluster is available')
      next()
    }
  })

  /**
   * Elasticsearch 5.0 API
   * - create
   * - delete
   * - search
   * - count
   * - refresh
   * - bulk
   */

  hemera.add({
    topic,
    cmd: 'search',
    data: Joi.object().keys({
      index: Joi.string().required(),
      body: Joi.object().optional()
    })
  }, function (req, cb) {
    client.search(req.data, cb)
  })

  hemera.add({
    topic,
    cmd: 'create',
    data: Joi.object().keys({
      index: Joi.string().required(),
      type: Joi.string().required(),
      id: Joi.string().required(),
      body: Joi.object().required()
    })
  }, function (req, cb) {
    client.create(req.data, cb)
  })

  hemera.add({
    topic,
    cmd: 'delete',
    data: Joi.object().keys({
      index: Joi.string().required(),
      type: Joi.string().required(),
      id: Joi.string().required(),
      ignore: Joi.array().default([404]).optional()
    })
  }, function (req, cb) {
    client.delete(req.data, cb)
  })

  hemera.add({
    topic,
    cmd: 'count',
    data: Joi.object().keys({
      index: Joi.string().required()
    })
  }, function (req, cb) {
    client.count(req.data, cb)
  })

  hemera.add({
    topic,
    cmd: 'bulk',
    data: Joi.object().keys({
      body: Joi.object().required()
    })
  }, function (req, cb) {
    client.bulk(req.data, cb)
  })

  hemera.add({
    topic,
    cmd: 'refresh',
    data: Joi.object().keys({
      index: Joi.array().items(Joi.string()).required(),
      body: Joi.object().required()
    })
  }, function (req, cb) {
    client.refresh(req.data, cb)
  })
}

exports.options = {
  payloadValidator: 'hemera-joi',
  elasticsearch: {
    timeout: 3000,
    host: 'localhost:9200',
    apiVersion: '5.0'
  }
}

exports.attributes = {
  dependencies: ['hemera-joi'],
  pkg: require('./package.json')
}
