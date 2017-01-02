'use strict'

const Arangojs = require('arangojs')

exports.plugin = function hemeraArangoStore(options) {

  const hemera = this

  let db = Arangojs(options.arango)

  hemera.expose('aqlTemplate', Arangojs.aql)

  function switchDb(databaseName) {

    if (databaseName) {
      db.useDatabase(databaseName)
    }
  }

  /**
   * Create a new database
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'createDatabase'
  }, function (req, cb) {

    db.createDatabase(req.name, req.users).create().then((res) => cb(null, res)).catch(cb)

  })

  /**
   * Create a new collection
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'createCollection'
  }, function (req, cb) {

    switchDb(req.databaseName)

    let collection

    if (req.type === 'edge') {
      collection = db.edgeCollection(req.name)
    } else {
      collection = db.collection(req.name)
    }

    collection.create().then((res) => cb(null, res)).catch(cb)

  })

  /**
   * Execute a AQL query and return the first result
   */
  hemera.add({
    topic: 'arango-store',
    type: 'one',
    cmd: 'executeAqlQuery'
  }, function (req, cb) {

    switchDb(req.databaseName)

    db.query(req.query, req.variables).then((cursor) => {

      return cursor.next()

    })
    .then(value => {

      cb(null, value)
    })
    .catch((err) => {

      cb(err)
    })

  })

  /**
   * Execute a AQL query and return all results
   */
  hemera.add({
    topic: 'arango-store',
    type: 'all',
    cmd: 'executeAqlQuery'
  }, function (req, cb) {

    switchDb(req.databaseName)

    db.query(req.query, req.variables).then((cursor) => {

      return cursor.all()

    })
    .then(value => {

      cb(null, value)
    })
    .catch((err) => {

      cb(err)
    })

  })

}

exports.options = {
  arango: null,
}

exports.attributes = {
  name: 'hemera-arango-store'
}
