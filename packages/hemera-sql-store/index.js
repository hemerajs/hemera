'use strict'

const Knex = require('knex')
const HemeraParambulator = require('hemera-parambulator')

/**
 * Actions:
 *
 * Common API methods:
 *
 * create
 * remove
 * removeById
 * update
 * updateById
 * find
 * findById
 * replace
 * replaceById
 */

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
    db.table(req.table).insert(req.data).asCallback(cb);
  })

}

exports.options = {
  url: null,
  connection: null
}

exports.attributes = {
  name: 'hemera-sql-store'
}
