'use strict'

const Hp = require('hemera-plugin')
const Knex = require('knex')
const SqlStore = require('./store')
const StorePattern = require('hemera-store/pattern')

function hemeraSqlStore(hemera, opts, done) {
  const connections = {}
  const topic = 'sql-store'

  hemera.decorate('sqlStore', {
    useDb
  })

  /**
   * Create new knex per database
   * Connection pooling is handled by knex
   *
   * @param {any} databaseName
   * @returns
   */
  function useDb(databaseName) {
    if (connections[databaseName]) {
      return connections[databaseName]
    }

    // try to create new db connection based on knex settings
    if (opts.knex.connection) {
      let options = Object.assign({}, opts.knex)

      if (databaseName) {
        options.connection.database = databaseName
      }

      connections[databaseName] = Knex(options)

      return connections[databaseName]
    }

    // fallback to passed knex instance
    const dbName = opts.knex.driver.client.database()
    if (dbName !== databaseName) {
      throw new Error(
        `Default database is '${dbName}' but trying to connect to '${databaseName}'`
      )
    }
    connections[dbName] = opts.knex.driver
    return connections[dbName]
  }

  /**
   * Create a new record
   */
  hemera.add(StorePattern.create(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.create(req, cb)
  })

  /**
   * Find a record by id
   */
  hemera.add(StorePattern.findById(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.findById(req, cb)
  })

  /**
   * Update a record by id
   */
  hemera.add(StorePattern.updateById(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.updateById(req, req.data, cb)
  })

  /**
   * Replace a record by id
   */
  hemera.add(StorePattern.replaceById(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.replaceById(req, req.data, cb)
  })

  /**
   * Update entities
   */
  hemera.add(StorePattern.update(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.update(req, req.data, cb)
  })

  /**
   * Update entities
   */
  hemera.add(StorePattern.replace(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.replace(req, req.data, cb)
  })

  /**
   * Remove an entity by id
   */
  hemera.add(StorePattern.removeById(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.removeById(req, cb)
  })

  /**
   * Remove by query
   */
  hemera.add(StorePattern.remove(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.remove(req, cb)
  })

  /**
   * find
   */
  hemera.add(StorePattern.find(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.find(req, req.options, cb)
  })

  /**
   * exists
   */
  hemera.add(StorePattern.exists(topic), function(req, cb) {
    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.exists(req, cb)
  })

  done()
}

const plugin = Hp(hemeraSqlStore, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  knex: {}
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
