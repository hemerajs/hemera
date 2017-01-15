'use strict'

const Knex = require('knex')
const HemeraParambulator = require('hemera-parambulator')
const SqlStore = require('./store')

exports.plugin = function hemeraSqlStore(options) {

  const hemera = this
  const connections = {}

  hemera.use(HemeraParambulator)

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
  hemera.add({
    topic: 'sql-store',
    cmd: 'create',
    table: {
      required$: true,
      type$: 'string'
    },
    data: {
      required$: true,
      type$: 'object'
    },
  }, function (req, cb) {

    let db = useDb(req.database)

    const store = new SqlStore(db)

    store.create(req, cb)
  })

}

exports.options = {
  payloadValidator: 'hemera-parambulator'
}

exports.attributes = {
  name: 'hemera-sql-store',
  dependencies: ['hemera-parambulator']
}
