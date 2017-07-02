'use strict'

const Code = require('code')
const EJSON = require('mongodb-extended-json')
const Utils = require('./utils')

const now = new Date()
const expect = Code.expect

describe('Hemera-mongo-store with EJSON', function () {
  const topic = 'mongo-store'
  const testCollection = 'test'
  const options = {
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

  it('create with extended json', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: Utils.createExtendedData(plugin.mongodb)
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp._id).to.be.exists()
      Utils.testExtendedData(plugin, testCollection, resp._id, done)
    })
  })

  it('create with extended json (manually)', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        date: { $date: new Date() },
        objectId: { $oid: new plugin.mongodb.ObjectID() },
        ref: { $ref: 'test', $id: 1234 }
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp._id).to.be.exists()
      Utils.testExtendedData(plugin, testCollection, resp._id, done)
    })
  })

  it('update can query with extended json', function (done) {
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
        cmd: 'update',
        collection: testCollection,
        data: {
          $set: { name: 'foo' }
        },
        query: EJSON.serialize({ date: now })
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        done()
      })
    })
  })

  it('update with extended json', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jacob'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'update',
        collection: testCollection,
        data: {
          $set: Utils.createExtendedData(plugin.mongodb)
        },
        query: {
          name: 'jacob'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()
        Utils.testExtendedData(plugin, testCollection, resp._id, done)
      })
    })
  })

  it('updatebyId with extended json', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jacob'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'updateById',
        collection: testCollection,
        data: {
          $set: Utils.createExtendedData(plugin.mongodb)
        },
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()
        Utils.testExtendedData(plugin, testCollection, resp._id, done)
      })
    })
  })

  it('remove can query with extended json', function (done) {
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
        cmd: 'remove',
        collection: testCollection,
        query: EJSON.serialize({ date: now })
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.deletedCount).to.be.at.least(1)
        done()
      })
    })
  })

  it('find can query with extended json', function (done) {
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
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.an.array()
        expect(resp.result[0]._id).to.be.exists()
        expect(resp.result[0].date).to.be.exists()
        done()
      })
    })
  })

  it('find can query with regular expressions', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: { name: 'Jacob' }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'find',
        collection: testCollection,
        query: EJSON.serialize({ name: new RegExp(/^jac/, 'i') })
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.an.array()
        expect(resp.result[0]._id).to.be.exists()
        expect(resp.result[0].name).to.be.exists()

        // Test with native extended JSON
        hemera.act({
          topic,
          cmd: 'find',
          collection: testCollection,
          query: { name: { $regex: '^jac', $options: 'i' } }
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.result).to.be.an.array()
          expect(resp.result[0]._id).to.be.exists()
          expect(resp.result[0].name).to.be.exists()
          done()
        })
      })
    })
  })

  it('replace with extended json', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jacob'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      const id = new plugin.mongodb.ObjectID(resp._id)

      hemera.act({
        topic,
        cmd: 'replace',
        collection: testCollection,
        data: {
          $set: Utils.createExtendedData(plugin.mongodb)
        },
        query: EJSON.serialize({ _id: id })
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.matchedCount).to.be.exists()
        expect(resp.modifiedCount).to.be.exists()
        expect(resp.upsertedCount).to.be.exists()
        Utils.testExtendedData(plugin, testCollection, id, done)
      })
    })
  })

  it('replace can query with extended json', function (done) {
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
        cmd: 'replace',
        collection: testCollection,
        data: {
          $set: {
            name: 'nadja'
          }
        },
        query: EJSON.serialize({ date: now })
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.matchedCount).to.be.exists()
        expect(resp.modifiedCount).to.be.exists()
        expect(resp.upsertedCount).to.be.exists()
        done()
      })
    })
  })

  it('replaceById with extended json', function (done) {
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jacob'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'replaceById',
        collection: testCollection,
        data: Utils.createExtendedData(plugin.mongodb),
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()
        Utils.testExtendedData(plugin, testCollection, resp._id, done)
      })
    })
  })
})
