'use strict'

const Arangojs = require('arangojs')
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
 *
 * Driver specific API methods:
 *
 * executeTransaction
 * createDatabase
 * createCollection
 * executeAqlQuery
 */

exports.plugin = function hemeraArangoStore(options) {

  const hemera = this
  const connections = {}

  hemera.use(HemeraParambulator)

  hemera.expose('aqlTemplate', Arangojs.aql)
  hemera.expose('connectionPool', connections)

  /**
   * Create pool of database connections
   */
  function useDb(databaseName) {

    if (connections[databaseName]) {

      return connections[databaseName]
    }

    if (databaseName) {

      let option = Object.assign({}, options.arango);
      option.databaseName = databaseName

      connections[databaseName] = new Arangojs.Database(option)

      return connections[databaseName]
    }

    connections[databaseName] = options.arango.driver

    return connections[databaseName]
  }

  /**
   * Create a new database
   */
  hemera.add({
    topic: 'arango-store',
    cmd: 'createDatabase'
  }, function (req, cb) {

    let db = useDb('_system')

    db.createDatabase(req.name, req.users, (err, res) => {

      if (err) {
        return cb(new Error(err.message))
      }

      return cb(null, res)

    })

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

    db.transaction(req.collections, action, req.params, req.lockTimeout, (err, res) => {

      if (err) {
        return cb(new Error(err.message))
      }

      return cb(null, res)

    })

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

    collection.create((err, res) => {

      if (err) {
        return cb(new Error(err.message))
      }

      return cb(null, res)

    })

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

    db.query(req.query, req.variables, (err, res) => {

      if (err) {
        return cb(new Error(err.message))
      }

      return res.next(cb)

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

    let db = useDb(req.databaseName)

    db.query(req.query, req.variables, (err, res) => {

      if (err) {
        return cb(new Error(err.message))
      }

      return res.all(cb)

    })

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'create',
    collection: {
      required$: true,
      type$: 'string'
    },
    data: {
      type$: 'object'
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .save(req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'update',
    data: {
      type$: 'object'
    },
    filter: {
      type$: 'object',
      default$: {}
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .updateByExample(req.filter, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'updateById',
    data: {
      type$: 'object'
    },
    id: {
      required$: true,
      type$: 'object'
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .updateByExample(req.id, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'remove',
    filter: {
      type$: 'object',
      default$: {}
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .removeByExample(req.filter, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'removeById',
    id: {
      required$: true,
      type$: 'object'
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .removeByExample(req.id, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'replace',
    data: {
      type$: 'object'
    },
    filter: {
      type$: 'object',
      default$: {}
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .replaceByExample(req.filter, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'replaceById',
    data: {
      type$: 'object'
    },
    id: {
      required$: true,
      type$: 'object'
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .replaceByExample(req.id, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'findById',
    id: {
      required$: true
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .byExample(req.id, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return res.next(cb)

      });

  })

  hemera.add({
    topic: 'arango-store',
    cmd: 'find',
    filter: {
      type$: 'object',
      default$: {}
    }
  }, function (req, cb) {

    let db = useDb(req.databaseName)

    db.collection(req.collection)
      .byExample(req.filter, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        res.all(cb)

      });

  })

}

exports.options = {
  payloadValidator: 'hemera-parambulator'
}

exports.attributes = {
  name: 'hemera-arango-store',
  dependencies: ['hemera-parambulator']
}
