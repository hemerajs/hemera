'use strict'

const Code = require('code')
const Utils = require('./utils')
const expect = Code.expect

<<<<<<< HEAD
describe('Hemera-mongo-store, multiple databases', function () {
=======
describe('Hemera-mongo-store', function () {
>>>>>>> 09247a0
  const topic = 'mongo-store.test'
  const testCollection = 'test'
  const options = {
    multiDb: true,
    mongo: {
      url: 'mongodb://localhost:27017/test'
    }
  }
  let server
  let hemera

  before(function (done) {
    Utils.initServer(topic, testCollection, options, (err, resp) => {
      if (err) {
        throw err
      }

      server = resp.server
      hemera = resp.hemera
      done()
    })
  })

  after(function (done) {
    hemera.close()
    server.kill()
    done()
  })

<<<<<<< HEAD
  it('create, multi db support', function (done) {
=======
  it('create', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'peter'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp._id).to.be.exists()

      done()
    })
  })

<<<<<<< HEAD
  it('create multiple documents, multi db support', function (done) {
=======
  it('create multiple documents', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: [
        { name: 'peter' }, { name: 'parker' }
      ]
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp._ids).to.be.an.array().length(2)

      done()
    })
  })

<<<<<<< HEAD
  it('update, multi db support', function (done) {
=======
  it('update', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'peter'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'update',
        collection: testCollection,
        data: {
          $set: {
            name: 'nadja'
          }
        },
        query: {
          name: 'peter'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()

        done()
      })
    })
  })

<<<<<<< HEAD
  it('updatebyId, multi db support', function (done) {
=======
  it('updatebyId', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'peter'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'updateById',
        collection: testCollection,
        data: {
          $set: {
            name: 'nadja'
          }
        },
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()

        done()
      })
    })
  })

<<<<<<< HEAD
  it('remove, multi db support', function (done) {
=======
  it('remove', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'olaf'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'remove',
        collection: testCollection,
        query: {
          name: 'olaf'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.deletedCount).to.be.equals(1)

        done()
      })
    })
  })

<<<<<<< HEAD
  it('removeById, multi db support', function (done) {
=======
  it('removeById', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'olaf'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'removeById',
        collection: testCollection,
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()

        done()
      })
    })
  })

<<<<<<< HEAD
  it('findById, multi db support', function (done) {
=======
  it('findById', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jens'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'findById',
        collection: testCollection,
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()

        done()
      })
    })
  })

<<<<<<< HEAD
  it('find, multi db support', function (done) {
=======
  it('find', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jens'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'find',
        collection: testCollection,
        query: {}
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.an.array()
        expect(resp.result[0]._id).to.be.exists()
        expect(resp.result[0].name).to.be.exists()
        done()
      })
    })
  })

<<<<<<< HEAD
  it('find with pagination, multi db support', function (done) {
=======
  it('find with pagination', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'jens'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'find',
        collection: testCollection,
        query: {},
        options: {
          limit: 10,
          offset: 2
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.an.array()
        expect(resp.result[0]._id).to.be.exists()
        expect(resp.result[0].name).to.be.exists()
        expect(resp.limit).to.be.equals(10)
        expect(resp.offset).to.be.equals(2)
        done()
      })
    })
  })

<<<<<<< HEAD
  it('replace, multi db support', function (done) {
=======
  it('replace', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'nadine'
      }
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
        query: {}
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

<<<<<<< HEAD
  it('replaceById, multi db support', function (done) {
=======
  it('replaceById', function (done) {
>>>>>>> 09247a0
    hemera.act({
      topic,
      cmd: 'create',
      collection: testCollection,
      data: {
        name: 'nadja'
      }
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()

      hemera.act({
        topic,
        cmd: 'replaceById',
        collection: testCollection,
        data: {
          name: 'nadja'
        },
        id: resp._id
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp._id).to.be.exists()
        expect(resp.name).to.be.exists()
        done()
      })
    })
  })
})
