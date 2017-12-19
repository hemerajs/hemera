'use strict'

const Redis = require('redis')
const Hp = require('hemera-plugin')

function hemeraRedisCache(hemera, opts, done) {
  const client = Redis.createClient(opts.redis)
  const topic = 'redis-cache'

  const Joi = hemera.joi

  hemera.decorate('redis', {
    client
  })

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    hemera.log.debug('Redis connection closed!')
    client.quit()
    done()
  })

  client.on('ready', function() {
    hemera.log.info('Redis Cache is ready')
    done()
  })

  client.on('end', function() {
    hemera.log.warn('Redis client connection closed')
  })

  client.on('reconnecting', function(msg) {
    hemera.log.info(msg, 'Redis client is reconnecting')
  })

  client.on('warning', function(msg) {
    hemera.log.warn(msg, 'Redis client warning')
  })

  client.on('error', function(err) {
    hemera.log.fatal(err)
    hemera.fatal()
  })

  hemera.add(
    {
      topic,
      cmd: 'set',
      key: Joi.string().required(),
      value: Joi.any().required()
    },
    function(req, cb) {
      client.set(req.key, req.value, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'get',
      key: Joi.string().required()
    },
    function(req, cb) {
      client.get(req.key, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'hmset',
      key: Joi.string().required(),
      values: Joi.any().required()
    },
    function(req, cb) {
      client.hmset(req.key, req.values, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'hget',
      key: Joi.string().required(),
      values: Joi.any().required()
    },
    function(req, cb) {
      client.hget(req.key, req.values, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'hgetall',
      key: Joi.string().required()
    },
    function(req, cb) {
      client.hgetall(req.key, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'expire',
      key: Joi.string().required(),
      ttlSeconds: Joi.number().required()
    },
    function(req, cb) {
      client.expire(req.key, req.ttlSeconds, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'exists',
      key: Joi.string().required()
    },
    function(req, cb) {
      client.exists(req.key, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'ttl',
      key: Joi.string().required()
    },
    function(req, cb) {
      client.ttl(req.key, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'del',
      key: Joi.string().required()
    },
    function(req, cb) {
      client.del(req.key, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'lpush',
      key: Joi.string().required(),
      values: Joi.any().required()
    },
    function(req, cb) {
      client.lpush(req.key, req.values, cb)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'rpush',
      key: Joi.string().required(),
      values: Joi.any().required()
    },
    function(req, cb) {
      client.rpush(req.key, req.values, cb)
    }
  )
}

const plugin = Hp(hemeraRedisCache, '>=3')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  redis: null
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
