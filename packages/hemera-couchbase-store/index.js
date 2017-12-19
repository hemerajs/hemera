'use strict'

const Hp = require('hemera-plugin')
const Couchbase = require('couchbase')

function hemeraCouchbaseStore(hemera, opts, done) {
  const topic = 'couchbase-store'

  const Joi = hemera.joi
  const cluster = new Couchbase.Cluster(opts.couchbase.url)
  const N1qlQuery = Couchbase.N1qlQuery

  hemera.decorate('couchbase', {
    getBucket,
    cluster
  })

  function getBucket(name) {
    if (opts.couchbase.bucketInstance) {
      return opts.couchbase.bucketInstance
    } else {
      return cluster.openBucket(name)
    }
  }

  hemera.add(
    {
      topic,
      cmd: 'query',
      bucket: Joi.string()
        .optional()
        .default('default'),
      query: Joi.string().required(),
      vars: Joi.array()
        .items(Joi.string(), Joi.number())
        .default([])
    },
    function(req, cb) {
      const bucket = getBucket(req.bucket)
      const query = N1qlQuery.fromString(req.query)
      bucket.query(query, req.vars, cb)
    }
  )

  done()
}

const plugin = Hp(hemeraCouchbaseStore, '>=3')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  couchbase: {
    url: 'couchbase://localhost/',
    defaultBucket: 'default'
  }
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
