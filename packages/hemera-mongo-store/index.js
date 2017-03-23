'use strict'

const Mongodb = require('mongodb')
const ObjectID = Mongodb.ObjectID
const MongoStore = require('./store')
const StorePattern = require('hemera-store/pattern')

exports.plugin = function hemeraMongoStore (options, next) {
  const hemera = this
  const topic = 'mongo-store'

  Mongodb.MongoClient.connect(options.mongo.url, options.mongos.options, function (err, db) {
    if (err) throw err

    hemera.expose('db', db)
    hemera.expose('mongodb', Mongodb)
    
    hemera.add({
      topic,
      cmd: 'dropCollection'
    }, function (req, cb) {
      const collection = db.collection(req.collection)
      collection.drop(cb)
    })

    hemera.add(StorePattern.create(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.create(req, cb)
    })

    hemera.add(StorePattern.update(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.update(req, req.data, cb)
    })

    hemera.add(StorePattern.updateById(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.updateById(req, req.data, cb)
    })

    hemera.add(StorePattern.remove(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.remove(req, cb)
    })

    hemera.add(StorePattern.removeById(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.removeById(req, cb)
    })

    hemera.add(StorePattern.replace(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.replace(req, req.data, cb)
    })

    hemera.add(StorePattern.replaceById(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.replaceById(req, req.data, cb)
    })

    hemera.add(StorePattern.findById(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.findById(req, cb)
    })

    hemera.add(StorePattern.find(topic), function (req, cb) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection)
      store.ObjectID = ObjectID

      store.find(req, req.options, cb)
    })

    hemera.log.debug('DB connected!')
    next()
  })
}

exports.options = {
  mongos: {},
  mongo: {
    url: 'mongodb://localhost:27017/'
  }
}

exports.attributes = {
  dependencies: [],
  pkg: require('./package.json')
}
