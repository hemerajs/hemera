'use strict'

const Hp = require('hemera-plugin')
const StorePattern = require('hemera-store/pattern')

exports.plugin = Hp(function hemeraRethinkdbStore (options) {
  const hemera = this
  const topic = 'rethinkdb-store'
  const Joi = hemera.exposition['hemera-joi'].joi

  const rethinkdb = require('rethinkdbdash')(options.rethinkdb)

  hemera.expose('driver', rethinkdb)

  /**
   * Helper functions
   */

  hemera.add({
    topic,
    cmd: 'createDatabase',
    databaseName: Joi.string().default(options.rethinkdb.db)
  }, function (req, cb) {
    return rethinkdb.dbCreate(req.databaseName).run(cb)
  })

  hemera.add({
    topic,
    cmd: 'removeDatabase',
    databaseName: Joi.string().default(options.rethinkdb.db)
  }, function (req, cb) {
    return rethinkdb.dbDrop(req.databaseName).run(cb)
  })

  hemera.add({
    topic,
    cmd: 'createTable',
    collection: Joi.string().required(),
    databaseName: Joi.string().default(options.rethinkdb.db)
  }, function (req, cb) {
    return rethinkdb.db(req.databaseName).tableCreate(req.collection, {primaryKey: 'id'}).run(cb)
  })

  hemera.add({
    topic,
    cmd: 'removeTable',
    collection: Joi.string().required(),
    databaseName: Joi.string().default(options.rethinkdb.db)
  }, function (req, cb) {
    rethinkdb.db(req.databaseName).tableDrop(req.collection).run(cb)
  })

  hemera.add({
    topic,
    cmd: 'truncateTable',
    collection: Joi.string().required(),
    databaseName: Joi.string().default(options.rethinkdb.db)
  }, function (req, cb) {
    rethinkdb.db(req.databaseName).table(req.collection).delete().run(cb)
  })

  /**
   * Special functions
   */

  hemera.add({
    topic,
    cmd: 'changes',
    collection: Joi.string().required(),
    databaseName: Joi.string().default(options.rethinkdb.db),
    options: Joi.object().keys({
      fields: Joi.alternatives().try(Joi.object(), Joi.array()),
      orderBy: Joi.alternatives().try(Joi.object(), Joi.array(), Joi.string()),
      offset: Joi.number().integer(),
      limit: Joi.number().integer().default(1)
    }).default({})
  }, function (req, cb) {
    let cursor = rethinkdb.db(req.databaseName).table(req.collection)

    if (req.options.limit) {
      cursor = cursor.limit(options.limit)
    }
    if (req.options.offset) {
      cursor = cursor.skip(options.offset)
    }
    if (req.options.fields) {
      cursor = cursor.pluck(req.options.fields)
    }
    if (req.options.orderBy) {
      cursor = cursor.orderBy(req.options.orderBy)
    }

    cursor.run({stream: true}, (err, stream) => {
      if (err) {
        return cb(err)
      }

      stream.on('data', (data) => {
        cb(null, data)
      })
    })
  })

  /**
   * Store interface
   */

  hemera.add(StorePattern.create(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).insert(req.data).run(cb)
  })

  hemera.add(StorePattern.update(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).filter(req.query).update(req.data).run(cb)
  })

  hemera.add(StorePattern.updateById(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).get(req.id).update(req.data).run(cb)
  })

  hemera.add(StorePattern.remove(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).filter(req.query).delete().run(cb)
  })

  hemera.add(StorePattern.removeById(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).get(req.id).delete(req.data).run(cb)
  })

  hemera.add(StorePattern.replace(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).filter(req.query).replace().run(cb)
  })

  hemera.add(StorePattern.replaceById(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).get(req.id).replace(req.data).run(cb)
  })

  hemera.add(StorePattern.findById(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    rethinkdb.db(databaseName).table(req.collection).get(req.id).run(cb)
  })

  hemera.add(StorePattern.find(topic), function (req, cb) {
    const databaseName = req.databaseName || options.rethinkdb.db
    let cursor = rethinkdb.db(databaseName).table(req.collection).filter(req.query)

    if (req.options) {
      if (req.options.limit) {
        cursor = cursor.limit(options.limit)
      }
      if (req.options.offset) {
        cursor = cursor.skip(options.offset)
      }
      if (req.options.fields) {
        cursor = cursor.pluck(req.options.fields)
      }
      if (req.options.orderBy) {
        cursor = cursor.orderBy(req.options.orderBy)
      }
    }

    cursor.run({cursor: true}, (err, result) => {
      if (err) {
        return cb(err)
      }
      result.toArray(cb)
    })
  })
})

exports.options = {
  payloadValidator: 'hemera-joi',
  rethinkdb: {
    pool: true,
    cursor: true
  }
}

exports.attributes = {
  pkg: require('./package.json')
}
