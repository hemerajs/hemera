'use strict'

const Code = require('code')
const Utils = require('./utils')
const expect = Code.expect

describe('Hemera-mongo-store options', function() {
  const topic = 'mongo-store'
  const testCollection = 'test'
  const options = {
    mongo: {
      url: 'mongodb://localhost:27017/test'
    },
    store: {
      create: { serializeFunctions: true }, // MF: Dunno how to test this one
      update: { returnOriginal: false },
      updateById: { returnOriginal: false },
      find: {},
      findById: { explain: true },
      remove: {},
      removeById: { projection: { name: 1 } },
      replace: { upsert: false },
      replaceById: { projection: { name: 1 } }
    }
  }
  let server
  let hemera

  before(function(done) {
    Utils.initServer(topic, testCollection, options, (err, resp) => {
      if (err) {
        throw err
      }

      server = resp.server
      hemera = resp.hemera
      done()
    })
  })

  after(function(done) {
    hemera.close()
    server.kill()
    done()
  })

  it('create with `serializeFunctions`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'murdock'
        }
      },
      function(err, resp) {
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()
        expect(resp._id).to.exist()

        done()
      }
    )
  })

  it('update with `returnOriginal`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'matthew'
        }
      },
      function(err, resp) {
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()

        hemera.act(
          {
            topic,
            cmd: 'update',
            collection: testCollection,
            data: {
              $set: { name: 'elektra' }
            },
            query: {
              name: 'matthew'
            }
          },
          function(err, resp) {
            expect(err).to.not.exist()
            expect(resp).to.be.an.object()
            expect(resp._id).to.exist()
            expect(resp.name).to.equal('elektra')
          }
        )

        done()
      }
    )
  })

  it('updateById with `returnOriginal`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'matthew'
        }
      },
      function(err, resp) {
        expect(1).to.equal(1)
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()
        expect(resp._id).to.be.a.string()

        hemera.act(
          {
            topic,
            cmd: 'updateById',
            collection: testCollection,
            data: {
              $set: { name: 'elektra' }
            },
            id: resp._id
          },
          function(err, resp) {
            expect(err).to.not.exist()
            expect(resp).to.be.an.object()
            expect(resp._id).to.exist()
            expect(resp.name).to.equal('elektra')
          }
        )

        done()
      }
    )
  })

  it('findById with `limit`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'the kingpin'
        }
      },
      function(err, resp) {
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()

        hemera.act(
          {
            topic,
            cmd: 'findById',
            collection: testCollection,
            id: resp._id
          },
          function(err, resp) {
            expect(err).to.not.exist()
            expect(resp).to.be.an.object()
            expect(resp.indexBounds).to.be.an.object()

            done()
          }
        )
      }
    )
  })

  it('removeById with `projection`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'bullseye',
          side: 'villain'
        }
      },
      function(err, resp) {
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()

        hemera.act(
          {
            topic,
            cmd: 'removeById',
            collection: testCollection,
            id: resp._id
          },
          function(err, resp) {
            expect(err).to.not.exist()
            expect(resp._id).to.exist()
            expect(resp.name).to.exist()
            expect(resp.side).not.to.exist()

            done()
          }
        )
      }
    )
  })

  it('replace with `upsert`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'replace',
        collection: testCollection,
        data: {
          $set: {
            name: 'stick'
          }
        },
        query: { side: 'allies' }
      },
      function(err, resp) {
        expect(err).to.be.null()
        expect(resp).to.be.an.object()
        expect(resp.upsertedCount).to.equal(0)
        expect(resp.upsertedId).to.be.null()

        done()
      }
    )
  })

  it('replaceById with `projection`', function(done) {
    hemera.act(
      {
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'the hand',
          side: 'villain'
        }
      },
      function(err, resp) {
        expect(err).to.not.exist()
        expect(resp).to.be.an.object()

        hemera.act(
          {
            topic,
            cmd: 'replaceById',
            collection: testCollection,
            data: {
              name: 'kirigi',
              side: 'villain'
            },
            id: resp._id
          },
          function(err, resp) {
            expect(err).to.not.exist()
            expect(resp._id).to.exist()
            expect(resp.name).to.exist()
            expect(resp.side).not.to.exist()

            done()
          }
        )
      }
    )
  })
})
