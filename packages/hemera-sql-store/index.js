'use strict'

const Hp = require('hemera-plugin')
const Knex = require('knex')
const SqlStore = require('./store')
const StorePattern = require('hemera-store/pattern')

exports.plugin = Hp(hemeraSqlStore, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi'
}

function hemeraSqlStore(hemera, opts, done) {
  const connections = {}
  const topic = 'sql-store'

  hemera.decorate('sql', {
    useDb
  })

  function useDb(databaseName) {
    if (connections[databaseName]) {
      return connections[databaseName]
    }

    if (databaseName) {
      let option = Object.assign({}, opts.connection)
      option.database = databaseName

      connections[databaseName] = Knex({
        dialect: opts.dialect,
        connection: option,
        pool: {
          min: 0,
          max: 7
        }
      })

      return connections[databaseName]
    }

    connections[databaseName] = opts.knex.driver

    return connections[databaseName]
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
