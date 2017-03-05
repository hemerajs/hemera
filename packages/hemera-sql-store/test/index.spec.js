'use strict'

const Hemera = require('./../../hemera')
const Nats = require('nats')
const HemeraSqlStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
const Knex = require('knex')

const expect = Code.expect

describe('Hemera-sql-store', function () {
  let PORT = 6243
  let noAuthUrl = 'nats://localhost:' + PORT

  let server
  let hemera
  let knex
  let testDatabase = 'test'
  let testTable = 'user'

  /**
   * Setup table schema
   *
   * @param {any} driver
   * @param {any} cb
   * @returns
   */
  function setup (driver, cb) {
    driver.schema.dropTableIfExists(testTable).asCallback(() => {
      driver.schema.createTableIfNotExists(testTable, function (table) {
        table.increments()
        table.string('name')
      }).asCallback(cb)
    })
  }

  before(function (done) {
    knex = Knex({
      dialect: 'mysql', // do not use mariosql cause https://github.com/tgriesser/bookshelf/issues/415
      connection: {
        host: '127.0.0.1',
        user: 'test',
        password: 'test',
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
      const nats = Nats.connect(noAuthUrl)
      hemera = new Hemera(nats)
      hemera.use(HemeraJoi)
      hemera.use(HemeraSqlStore)
      hemera.ready(() => {
        setup(knex, done)
      })
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
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'findById',
        collection: testTable,
        id: ids[0]
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp[0].id).to.be.equal(ids[0])
        done()
      })
    })
  })

  it('updateById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'updateById',
        collection: testTable,
        id: ids[0],
        data: {
          name: 'new name'
        }
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equal(1)
        done()
      })
    })
  })

  it('update', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'update',
        collection: testTable,
        query: {
          id: ids[0]
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
  })

  it('replace', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'replace',
        collection: testTable,
        query: {
          id: ids[0]
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
  })

  it('replaceById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'replaceById',
        collection: testTable,
        id: ids[0],
        data: {
          name: 'new name'
        }
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equal(1)
        done()
      })
    })
  })

  it('removeById', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'deletia'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
      hemera.act({
        topic: 'sql-store',
        cmd: 'removeById',
        collection: testTable,
        id: ids[0]
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
        name: 'denora'
      }
    }, (err, ids) => {
      expect(err).to.be.not.exists()
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
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'bernd'
      }
    }, (err, resp) => {
      expect(err).to.be.not.exists()
      expect(resp[0]).to.be.greaterThan(0)

      hemera.act({
        topic: 'sql-store',
        cmd: 'find',
        collection: testTable,
        query: {
          name: 'bernd'
        },
        options: {
          orderBy: 'id desc',
          limit: 2
        }
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp.result.length).to.be.equals(1)
        expect(resp.result[0].name).to.be.equals('bernd')
        expect(resp.orderBy).to.be.equals('id desc')
        expect(resp.limit).to.be.equals(2)
        done()
      })
    })
  })

  it('exists', function (done) {
    hemera.act({
      topic: 'sql-store',
      cmd: 'create',
      collection: testTable,
      data: {
        name: 'maria'
      }
    }, (err, resp) => {
      expect(err).to.be.not.exists()
      expect(resp[0]).to.be.greaterThan(0)

      hemera.act({
        topic: 'sql-store',
        cmd: 'exists',
        collection: testTable,
        query: {
          name: 'maria'
        }
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.true()
        done()
      })
    })
  })
})
