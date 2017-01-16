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
   * Create a new database
   */
  hemera.add(StorePattern.create(topic), function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.create(req, cb)
  })

}

exports.options = {
  payloadValidator: 'hemera-joi'
}

exports.attributes = {
  name: 'hemera-sql-store',
  dependencies: ['hemera-joi']
}
