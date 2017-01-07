'use strict'

const Hemera = require('./../../hemera'),
  HemeraArangoStore = require('./../index'),
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
  let testDatabase = 'test'
  let testTable = 'users'


  before(function (done) {

    knex = Knex({
      dialect: 'mysql',
      connection: {
        host: '127.0.0.1',
        user: '',
        password: '',
        database: testDatabase
      },
      pool: {
        min: 0,
        max: 7
      }
    });

    HemeraArangoStore.options.knex = {
      driver: knex
    }

    server = HemeraTestsuite.start_server(PORT, {}, () => {

      //Connect to gnats
      const nats = require('nats').connect(noAuthUrl)

      //Create hemera instance
      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'silent'
      })

      hemera.use(HemeraArangoStore)

      hemera.ready(done);

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
      table: testTable,
      data: {
        name: 'olaf'
      }
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.equals([0])

      done()
    })
  })

})
