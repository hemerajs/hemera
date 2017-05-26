'use strict'

const Code = require('code')
const EJSON = require('mongodb-extended-json')
const Utils = require('./utils')

const now = new Date()
const expect = Code.expect

describe('Hemera-mongo-store with response serialization', function () {
  const topic = 'mongo-store'
  const testCollection = 'test-serialize'
  const options = {
    serializeResult: true,
    mongo: {
      url: 'mongodb://localhost:27017/test'
    }
  }
  let server
  let hemera
  let plugin

  before(function (done) {
    Utils.initServer(topic, testCollection, options, (err, resp) => {
      if (err) {
        throw err
      }

      server = resp.server
      hemera = resp.hemera
      plugin = resp.plugin
      done()
    })
  })

  after(function (done) {
    hemera.close()
    server.kill()
    done()
  })

  it('find will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: Utils.createExtendedData(plugin.mongodb, now)
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'find',
        collection: testCollection,
        query: EJSON.serialize({ date: now })
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.an.array()
        expect(resp.result[0]._id).to.be.instanceof(plugin.mongodb.ObjectID)
        Utils.testExtendedDoc(plugin, resp.result[0])
        done()
      })
    })
  })

  it('findById will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: Utils.createExtendedData(plugin.mongodb, now)
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'findById',
        collection: testCollection,
        id: resp._id
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp._id).to.be.instanceof(plugin.mongodb.ObjectID)
        Utils.testExtendedDoc(plugin, resp)
        done()
      })
    })
  })

  it('update will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: EJSON.serialize({
        name: 'jacob',
        date: new Date()
      })
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'update',
        collection: testCollection,
        data: {
          $set: { name: 'foo' }
        },
        query: {
          name: 'jacob'
        }
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.instanceof(plugin.mongodb.ObjectID)
        expect(resp.date).to.be.a.date()
        done()
      })
    })
  })

  it('updateById will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: EJSON.serialize({
        name: 'jacob',
        date: new Date()
      })
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'updateById',
        collection: testCollection,
        data: {
          $set: { name: 'foo' }
        },
        id: resp._id
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.instanceof(plugin.mongodb.ObjectID)
        expect(resp.date).to.be.a.date()
        done()
      })
    })
  })

  it('removeById will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: EJSON.serialize({
        name: 'jacob',
        date: new Date()
      })
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'removeById',
        collection: testCollection,
        id: resp._id
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.instanceof(plugin.mongodb.ObjectID)
        expect(resp.date).to.be.a.date()
        done()
      })
    })
  })

  it('replaceById will return an extended json result', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: EJSON.serialize({
        name: 'jacob',
        date: new Date()
      })
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'replaceById',
        collection: testCollection,
        data: {
          $set: { name: 'foo' }
        },
        id: resp._id
      }, function (err, resp) {
        resp = EJSON.deserialize(resp)
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.instanceof(plugin.mongodb.ObjectID)
        expect(resp.date).to.be.a.date()
        done()
      })
    })
  })
})
