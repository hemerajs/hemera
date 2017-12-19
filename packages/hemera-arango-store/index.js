'use strict'

const Hp = require('hemera-plugin')
const Arangojs = require('arangojs')
const ArangoStore = require('./store')
const StorePattern = require('hemera-store/pattern')

function hemeraArangoStore(hemera, opts, done) {
  const connections = {}
  const topic = 'arango-store'
  const Joi = hemera.joi

  hemera.decorate('arango', Arangojs)
  hemera.decorate('aqlTemplate', Arangojs.aql)

  function useDb(databaseName) {
    if (connections[databaseName]) {
      return connections[databaseName]
    }

    // try to create new db connection based on arango settings
    if (opts.arango.databaseName) {
      let options = Object.assign({}, opts.arango)

      if (databaseName) {
        options.databaseName = databaseName
      }

      connections[databaseName] = new Arangojs.Database(options)

      return connections[databaseName]
    }

    // fallback to passed database instance
    const dbName = opts.arango.driver.name

    if (dbName !== databaseName) {
      throw new Error(
        `Default database is '${dbName}' but trying to connect to '${databaseName}'`
      )
    }
    connections[dbName] = opts.arango.driver
    return connections[dbName]
  }

  /**
   * Create a new database
   */
  hemera.add(
    {
      topic,
      cmd: 'createDatabase',
      name: Joi.string().required(),
      users: Joi.array().optional()
    },
    function(req, cb) {
      let db = useDb('_system')

      db.createDatabase(req.name, req.users, (err, res) => {
        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)
      })
    }
  )

  /**
   * Execute a transaction
   */
  hemera.add(
    {
      topic,
      cmd: 'executeTransaction',
      collections: Joi.object().required(),
      action: Joi.string().required(),
      params: Joi.object().optional(),
      lockTimeout: Joi.object().optional()
    },
    function(req, cb) {
      let db = useDb(req.databaseName || opts.arango.databaseName)

      let action = String(req.action)

      db.transaction(
        req.collections,
        action,
        req.params,
        req.lockTimeout,
        (err, res) => {
          if (err) {
            return cb(new Error(err.message))
          }

          return cb(null, res)
        }
      )
    }
  )

  /**
   * Create a new collection
   */
  hemera.add(
    {
      topic,
      cmd: 'createCollection',
      name: Joi.string().required(),
      type: Joi.any()
        .allow(['edge', ''])
        .default(''),
      databaseName: Joi.string().optional()
    },
    function(req, cb) {
      let db = useDb(req.databaseName || opts.arango.databaseName)

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
    }
  )

  /**
   * Execute a AQL query and return the first result
   */
  hemera.add(
    {
      topic,
      type: 'one',
      cmd: 'executeAqlQuery',
      databaseName: Joi.string().optional(),
      variables: Joi.object().optional()
    },
    function(req, cb) {
      let db = useDb(req.databaseName || opts.arango.databaseName)

      db.query(req.query, req.variables, (err, res) => {
        if (err) {
          return cb(new Error(err.message))
        }

        return res.next(cb)
      })
    }
  )

  /**
   * Execute a AQL query and return all results
   */
  hemera.add(
    {
      topic,
      type: 'all',
      cmd: 'executeAqlQuery',
      databaseName: Joi.string().optional(),
      variables: Joi.object().optional()
    },
    function(req, cb) {
      let db = useDb(req.databaseName || opts.arango.databaseName)

      db.query(req.query, req.variables, (err, res) => {
        if (err) {
          return cb(new Error(err.message))
        }

        return res.all(cb)
      })
    }
  )

  hemera.add(StorePattern.create(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.create(req, cb)
  })

  hemera.add(StorePattern.update(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.update(req, req.data, cb)
  })

  hemera.add(StorePattern.updateById(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.updateById(req, req.data, cb)
  })

  hemera.add(StorePattern.remove(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.remove(req, cb)
  })

  hemera.add(StorePattern.removeById(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.removeById(req, cb)
  })

  hemera.add(StorePattern.replace(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.replace(req, req.data, cb)
  })

  hemera.add(StorePattern.replaceById(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.replaceById(req, req.data, cb)
  })

  hemera.add(StorePattern.findById(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.findById(req, cb)
  })

  hemera.add(StorePattern.find(topic), function(req, cb) {
    let db = useDb(req.databaseName || opts.arango.databaseName)

    const store = new ArangoStore(db)

    store.find(req, req.options, cb)
  })

  done()
}

const plugin = Hp(hemeraArangoStore, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  arango: {}
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
