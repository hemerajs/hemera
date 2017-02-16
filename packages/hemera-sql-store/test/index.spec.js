'use strict'

const Hemera = require('./../../hemera'),
  HemeraSqlStore = require('./../index'),
  Code = require('code'),
  HemeraTestsuite = require('hemera-testsuite'),
  Knex = require('knex')

const expect = Code.expect

describe('Hemera-sql-store', function () {
  let PORT = 6243
  let noAuthUrl = 'nats://localhost:' + PORT

  let server
  let hemera
  let knex
  let testDatabase = 'testdb'
  let testTable = 'product'

  before(function (done) {
    knex = Knex({
      dialect: 'mysql',
      connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'vagrant',
        database: testDatabase
      },
      pool: {
        min: 0,
        max: 7
      }
    })

    HemeraSqlStore.options.knex = {
      driver: knex
    }

    server = HemeraTestsuite.start_server(PORT, {}, () => {

      // Connect to gnats
      const nats = require('nats').connect(noAuthUrl)

      // Create hemera instance
      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'silent'
      })

      hemera.use(HemeraSqlStore)

      hemera.ready(done)
    })
  })

  after(function () {
    hemera.close()
    server.kill()
  })

  it('create', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'olaf'
      }
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp[0]).to.be.greaterThan(0)
      done()
    })
  })

  it('findById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'findById',
      collection: testTable,
      id: '1'
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp[0].id).to.be.equal(1)
      done()
    })
  })

  it('updateById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'updateById',
      collection: testTable,
      id: '2',
      data: {
        name: 'new name'
      }
    }, (err, resp) => {
      expect(err).to.be.not.exists()
      expect(resp).to.be.equal(1)
      done()
    })
  })

  it('update', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'update',
      collection: testTable,
      query: {
        id: 1
      },
      data: {
        name: 'new new name'
      }
    }, (err, resp) => {
      expect(err).to.be.not.exists()
      expect(resp).to.be.equal(1)
      done()
    })
  })

  it('removeById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'for delete'
      }
    }, (err, ids) => {

      hemera.act({
        topic: 'sql-store',
        cmd: 'removeById',
        collection: testTable,
        id: '' + ids[0]
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp).to.be.equal(1)
        done()
      })
    })
  })

  it('remove', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'for delete'
      }
    }, (err, ids) => {

      hemera.act({
        topic: 'sql-store',
        cmd: 'remove',
        collection: testTable,
        query: {
          id: ids[0]
        }
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp).to.be.equal(1)
        done()
      })
    })
  })

  it('find', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'find',
      collection: testTable,
      query: {
        name: 'olaf'
      },
      options: {
        orderBy: 'id desc',
        limit: 2
      }
    }, (err, resp) => {
      
      expect(err).to.be.not.exists()
      expect(resp.length).to.be.greaterThan(1)
      expect(resp[0].id).to.be.greaterThan(resp[1].id)
      done()
    })
  })
})
