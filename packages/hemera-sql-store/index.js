'use strict'

const Knex = require('knex')
const HemeraJoi = require('hemera-joi')
const SqlStore = require('./store')
const StorePattern = require('hemera-store/pattern')

exports.plugin = function hemeraSqlStore(options) {

  const hemera = this
  const connections = {}
  const topic = 'sql-store'

  hemera.use(HemeraJoi)

  hemera.expose('connectionPool', connections)

  function useDb(databaseName) {

    if (connections[databaseName]) {
      return connections[databaseName]
    }

    if (databaseName) {

      let option = Object.assign({}, options.connection);
      option.database = databaseName

      connections[databaseName] = Knex({
        dialect: options.dialect,
        connection: option,
        pool: {
          min: 0,
          max: 7
        }
      })

      return connections[databaseName]
    }

    connections[databaseName] = options.knex.driver

    return connections[databaseName]

  }

  /**
   * Create a new record
   */
  hemera.add(StorePattern.create(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.create(req, cb)
  })  

  /**
   * Find a record by id
   */
  hemera.add(StorePattern.findById(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.findById(req, cb)
  })
  
  /**
   * Update a record by id
   */
  hemera.add(StorePattern.updateById(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.updateById(req, req.data, cb)
  })
  
  /**
   * Update entities
   */
  hemera.add(StorePattern.update(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.update(req, req.data, cb)
  })
  
  /**
   * Remove an entity by id
   */
  hemera.add(StorePattern.removeById(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.removeById(req, cb)
  })
  
  /**
   * Remove by query
   */
  hemera.add(StorePattern.remove(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.remove(req, cb)
  })
  
  /**
   * find
   */
  hemera.add(StorePattern.find(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.find(req, req.options, cb)
  })

}

exports.options = {
  payloadValidator: 'hemera-joi'
}

exports.attributes = {
  name: 'hemera-sql-store',
  dependencies: ['hemera-joi']
}
