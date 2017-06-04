'use strict'

const Redis = require('redis')
const Hp = require('hemera-plugin')

exports.plugin = Hp(function hemeraRedisCache (options) {
  const hemera = this
  const client = Redis.createClient(options.redis)
  const topic = 'redis-cache'

  const Joi = hemera.exposition['hemera-joi'].joi

  hemera.expose('client', client)

  client.on('ready', function () {
    hemera.log.info('Redis Cache is ready')
  })

  client.on('end', function () {
    hemera.log.warn('Redis client connection closed')
  })

  client.on('reconnecting', function (msg) {
    hemera.log.info(msg, 'Redis client is reconnecting')
  })

  client.on('warning', function (msg) {
    hemera.log.warn(msg, 'Redis client warning')
  })

  client.on('error', function (err) {
    hemera.log.fatal(err)
    hemera.fatal()
  })

  hemera.add({
    topic,
    cmd: 'set',
    key: Joi.string().required(),
    value: Joi.any().required()
  }, function (req, cb) {
    client.set(req.key, req.value, cb)
  })

  hemera.add({
    topic,
    cmd: 'get',
    key: Joi.string().required()
  }, function (req, cb) {
    client.get(req.key, cb)
  })

  hemera.add({
    topic,
    cmd: 'hmset',
    key: Joi.string().required(),
    values: Joi.any().required()
  }, function (req, cb) {
    client.hmset(req.key, req.values, cb)
  })

  hemera.add({
    topic,
    cmd: 'hget',
    key: Joi.string().required(),
    values: Joi.any().required()
  }, function (req, cb) {
    client.hget(req.key, req.values, cb)
  })

  hemera.add({
    topic,
    cmd: 'hgetall',
    key: Joi.string().required()
  }, function (req, cb) {
    client.hgetall(req.key, cb)
  })

  hemera.add({
    topic,
    cmd: 'expire',
    key: Joi.string().required(),
    ttlSeconds: Joi.number().required()
  }, function (req, cb) {
    client.expire(req.key, req.ttlSeconds, cb)
  })

  hemera.add({
    topic,
    cmd: 'exists',
    key: Joi.string().required()
  }, function (req, cb) {
    client.exists(req.key, cb)
  })

  hemera.add({
    topic,
    cmd: 'ttl',
    key: Joi.string().required()
  }, function (req, cb) {
    client.ttl(req.key, cb)
  })
})

exports.options = {
  payloadValidator: 'hemera-joi',
  redis: null
}

exports.attributes = {
  pkg: require('./package.json')
}
