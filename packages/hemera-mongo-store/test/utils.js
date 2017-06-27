'use strict'

const Hemera = require('./../../hemera')
const HemeraMongoStore = require('./../index')
const Nats = require('nats')
const HemeraTestsuite = require('hemera-testsuite')
const EJSON = require('mongodb-extended-json')
const expect = require('code').expect

function createExtendedData (mongodb, date) {
  const oid = new mongodb.ObjectID('58c6c65ed78c6a977a0041a8')
  return EJSON.serialize({
    date: date || new Date(),
    objectId: oid,
    ref: mongodb.DBRef('test', oid)
  })
}

function testExtendedData (plugin, testCollection, id, done) {
  plugin.db.collection(testCollection).findOne({
    _id: new plugin.mongodb.ObjectID(id)
  }, (err, doc) => {
    expect(err).to.be.null()
    testExtendedDoc(plugin, doc)
    done()
  })
}

function testExtendedDoc (plugin, doc) {
  const ObjectID = plugin.mongodb.ObjectID
  const DBRef = plugin.mongodb.DBRef

  expect(doc.date).to.be.a.date()
  expect(doc.objectId).to.be.an.instanceof(ObjectID)
  expect(doc.ref).to.be.an.instanceof(DBRef)
}

function initServer (topic, testCollection, pluginOptions, cb) {
  let PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT

  const server = HemeraTestsuite.start_server(PORT, flags, () => {
    const nats = Nats.connect(authUrl)
    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })
    hemera.use(HemeraMongoStore, pluginOptions)
    hemera.ready(() => {
      const plugin = hemera.exposition['hemera-mongo-store']
      hemera.act({
        topic,
        cmd: 'dropCollection',
        collection: testCollection
      }, function (err, resp) {
        cb(null, { server, hemera, plugin })
      })
    })
  })
}

exports.initServer = initServer
exports.testExtendedData = testExtendedData
exports.createExtendedData = createExtendedData
exports.testExtendedDoc = testExtendedDoc
