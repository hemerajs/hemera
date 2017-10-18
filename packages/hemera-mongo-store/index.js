'use strict'

const Hp = require('hemera-plugin')
const Mongodb = require('mongodb')
const ObjectID = Mongodb.ObjectID
const MongoStore = require('./store')
const StorePattern = require('hemera-store/pattern')
const serialize = require('mongodb-extended-json').serialize
const deserialize = require('mongodb-extended-json').deserialize

exports.plugin = Hp(hemeraMongoStore, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi',
  mongos: {},
  serializeResult: false,
  mongo: {
    url: 'mongodb://localhost:27017/'
  },
  store: {
    create: {},
    update: {},
    updateById: {},
    find: {},
    findById: {},
    remove: {},
    removeById: {},
    replace: { upsert: true },
    replaceById: {}
  }
}

function hemeraMongoStore(hemera, opts, done) {
  let topic = 'mongo-store'

  const preResponseHandler = result => {
    if (opts.serializeResult === true) {
      return serialize(result)
    }
    return result
  }

  Mongodb.MongoClient.connect(opts.mongo.url, opts.mongos.options, function(
    err,
    db
  ) {
    if (err) {
      return hemera.emit('error', err)
    }

    // from mongodb driver
    const dbName = db.databaseName

    if (opts.useDbAsTopicSuffix) {
      topic = `mongo-store.${dbName}`
    }

    hemera.decorate('mongodb', {
      client: Mongodb,
      db
    })

    // Gracefully shutdown
    hemera.ext('onClose', (ctx, done) => {
      hemera.log.debug('Mongodb connection closed!')
      db.close(done)
    })

    hemera.add(
      {
        topic,
        cmd: 'dropCollection'
      },
      function(req, cb) {
        const collection = db.collection(req.collection)
        collection.drop(cb)
      }
    )

    hemera.add(StorePattern.create(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.data = deserialize(req.data)

      store.create(req, cb)
    })

    hemera.add(StorePattern.update(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      store.update(req, deserialize(req.data), (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.add(StorePattern.updateById(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.updateById(req, deserialize(req.data), (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.add(StorePattern.remove(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      store.remove(req, cb)
    })

    hemera.add(StorePattern.removeById(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.removeById(req, (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.add(StorePattern.replace(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      store.replace(req, deserialize(req.data), cb)
    })

    hemera.add(StorePattern.replaceById(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.replaceById(req, deserialize(req.data), (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.add(StorePattern.findById(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.findById(req, (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.add(StorePattern.find(topic), function(req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      store.find(req, req.options, (err, result) => {
        if (err) {
          cb(err)
        } else {
          cb(null, preResponseHandler(result))
        }
      })
    })

    hemera.log.debug('DB connected!')
    done()
  })
}
