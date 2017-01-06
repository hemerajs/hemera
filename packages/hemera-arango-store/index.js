'use strict'

const Arangojs = require('arangojs')

exports.plugin = function hemeraArangoStore(options) {

  const hemera = this

  hemera.expose('aqlTemplate', Arangojs.aql)

  const pool = {}

  /**
   * Create pool of database connections
   */
  function useDb(databaseName) {

    let db
    let arangoOptions = {
      databaseName
    }

    Object.assign(arangoOptions, options.arango)

    // explicit by request
    if (databaseName) {

      if (pool[databaseName]) {

        return pool[databaseName].connection
      } else {

        pool[databaseName] = {
          connection: null
        }
      }

      db = new Arangojs.Database(arangoOptions)
      pool[databaseName].connection = db
    }
    else if (options.arango.dbInstance) {

      db = options.arango.dbInstance
    } else {

      db = new Arangojs.Database(arangoOptions)
    }

    return db
  }

  /**
   * Create a new database
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'createDatabase'
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.createDatabase(req.name, req.users)
      .then((res) => cb(null, res))
      .catch((err) => cb(new Error(err.message)))

  })

  /**
   * Execute a transaction
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'executeTransaction'
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    let action = String(req.action)

    db.transaction(req.collections, action, req.params, req.lockTimeout)
      .then((res) => cb(null, res))
      .catch((err) => cb(new Error(err.message)))

  })

  /**
   * Create a new collection
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'createCollection'
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    let collection

    if (req.type === 'edge') {
      collection = db.edgeCollection(req.name)
    } else {
      collection = db.collection(req.name)
    }

    collection.create()
      .then((res) => cb(null, res))
      .catch((err) => cb(new Error(err.message)))

  })

  /**
   * Execute a AQL query and return the first result
   */
  hemera.add({
    topic: 'arango-store',
    type: 'one',
    cmd: 'executeAqlQuery'
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.query(req.query, req.variables).then((cursor) => {

      return cursor.next()

    })
    .then((res) => cb(null, res))
    .catch((err) => cb(new Error(err.message)))

  })

  /**
   * Execute a AQL query and return all results
   */
  hemera.add({
    topic: 'arango-store',
    type: 'all',
    cmd: 'executeAqlQuery'
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.query(req.query, req.variables).then((cursor) => {

      return cursor.all()

    })
    .then((res) => cb(null, res))
    .catch((err) => cb(new Error(err.message)))

  })

}

exports.options = {
  arango: null,
}

exports.attributes = {
  name: 'hemera-arango-store'
}
