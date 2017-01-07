'use strict'

const Hemera = require('./../../hemera'),
  HemeraArangoStore = require('./../index'),
  Code = require('code'),
  HemeraTestsuite = require('hemera-testsuite'),
  Arangojs = require('arangojs')

const expect = Code.expect

describe('Hemera-arango-store', function () {

  let PORT = 6243
  let flags = ['--user', 'derek', '--pass', 'foobar']
  let authUrl = 'nats://derek:foobar@localhost:' + PORT
  let noAuthUrl = 'nats://localhost:' + PORT

  let server
  let arangoOptions = {
    url: 'http://127.0.0.1:8529/'
  }
  let hemera
  let aql
  let arangodb
  let testDatabase = 'test'

  function clearArangodb() {

    arangodb.useDatabase('_system')
    return arangodb.listUserDatabases()
      .then(names => {

        return Promise.all(names.filter(f => f.indexOf('system') < 0)
          .map(x => arangodb.dropDatabase(x)))
      })
  }

  function bootstrapArangodb() {
    return arangodb.createDatabase(testDatabase)
  }

  before(function (done) {

    arangodb = Arangojs(arangoOptions)
    HemeraArangoStore.options.arango = {
      dbInstance: arangodb
    }

    //clear and bootstrap db
    clearArangodb().then(bootstrapArangodb).then(() => {

      server = HemeraTestsuite.start_server(PORT, flags, () => {

        //Connect to gnats
        const nats = require('nats').connect(authUrl)

        //Create hemera instance
        hemera = new Hemera(nats, {
          crashOnFatal: false,
          logLevel: 'silent'
        })
        hemera.use(HemeraArangoStore)
        //Load plugin
        aql = hemera.exposition['hemera-arango-store'].aqlTemplate
        hemera.ready(done);

      })

    })

  })

  after(function () {

    //clear arangodb and kill gnats and hemera
    return clearArangodb().then(() => {
      hemera.close()
      server.kill()
    })

  })

  it('Create database', function (done) {

    const testDb = 'testdb'

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: testDb
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.result).to.be.equals(true)

      done()
    })
  })

  it('Create edge collection', function (done) {

    const testCollection = 'payments'

    hemera.act({
      topic: 'arango-store',
      cmd: 'createCollection',
      type: 'edge',
      name: testCollection,
      databaseName: testDatabase
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.name).to.be.equals(testCollection)

      done()
    })
  })

  it('Create collection', function (done) {

    const testCollection = 'users'

    hemera.act({
      topic: 'arango-store',
      cmd: 'createCollection',
      name: testCollection,
      databaseName: testDatabase
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.name).to.be.equals(testCollection)

      done()
    })
  })

  it('Execute AQL Query with one result', function (done) {

    const testCollection = 'apples'

    hemera.act({
      topic: 'arango-store',
      cmd: 'createCollection',
      name: testCollection,
      databaseName: testDatabase
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.name).to.be.equals(testCollection)

      const user = {
        name: 'olaf'
      }

      hemera.act({
        topic: 'arango-store',
        cmd: 'executeAqlQuery',
        type: 'one',
        databaseName: testDatabase,
        query: aql `INSERT ${user} INTO apples return NEW`
      }, function (err, resp) {

        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()

        done()
      })

    })
  })

  it('Execute AQL Query with multiple returns', function (done) {

    const testCollection = 'cars'

    hemera.act({
      topic: 'arango-store',
      cmd: 'createCollection',
      name: testCollection,
      databaseName: testDatabase
    }, (err, resp) => {

      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.name).to.be.equals(testCollection)

      hemera.act({
        topic: 'arango-store',
        cmd: 'executeAqlQuery',
        type: 'all',
        databaseName: testDatabase,
        query: `
            FOR u IN cars
            RETURN u
            `
      }, function (err, resp) {

        expect(err).to.be.not.exists()
        expect(resp).to.be.an.array()

        done()
      })

    })
  })

  it('Execute Transaction', function (done) {

    var action = String(function () {
      return true
    })

    hemera.act({
      topic: 'arango-store',
      cmd: 'executeTransaction',
      databaseName: testDatabase,
      action,
      params: {
        age: 12
      },
      collections: {
        read: 'users'
      }
    }, function (err, resp) {

      expect(err).to.be.not.exists()

      expect(resp).to.be.equals(true)

      done()
    })

  })

})
