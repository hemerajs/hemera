'use strict'

const Hemera = require('./../../hemera'),
  HemeraArangoStore = require('./../index'),
  Code = require('code'),
  HemeraTestsuite = require('hemera-testsuite'),
  Arangojs = require('arangojs')

const expect = Code.expect

process.setMaxListeners(0);

describe('Hemera-arango-store', function () {

  var PORT = 6243
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT

  var server
  var arangoOptions = {
    url: 'http://127.0.0.1:8529/'
  }
  var hemera
  var aql
  var arangodb

  function clearArangodb() {

    arangodb.useDatabase('_system')
    return arangodb.listUserDatabases()
      .then(names => {

        return Promise.all(names.filter(f => f.indexOf('system') < 0)
          .map(x => arangodb.dropDatabase(x)))
      })
  }

  before(function (done) {

    arangodb = Arangojs(arangoOptions)
    HemeraArangoStore.options.arango = {
      dbInstance: arangodb
    }
    server = HemeraTestsuite.start_server(PORT, flags, () => {

      const nats = require('nats').connect(authUrl)

      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'silent'
      })
      hemera.use(HemeraArangoStore)
      aql = hemera.exposition['hemera-arango-store'].aqlTemplate
      hemera.ready(done);

    })

  })

  after(function () {

    return clearArangodb().then(() => {
      hemera.close()
      server.kill()
    })

  })

  it('Create database', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      done()
    })
  })

  it('Create edge collection', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test2'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      hemera.act({
        topic: 'arango-store',
        cmd: 'createCollection',
        type: 'edge',
        name: 'testCollection',
        databaseName: 'test2'
      }, (err, resp) => {

        expect(err).to.be.not.exists()

        done()
      })
    })
  })

  it('Create collection', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test3'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      hemera.act({
        topic: 'arango-store',
        cmd: 'createCollection',
        name: 'testCollection',
        databaseName: 'test3'
      }, (err, resp) => {

        expect(err).to.be.not.exists()

        done()
      })
    })
  })

  it('Execute AQL Query with one result', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test4'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      hemera.act({
        topic: 'arango-store',
        cmd: 'createCollection',
        name: 'users',
        databaseName: 'test4'
      }, (err, resp) => {

        expect(err).to.be.not.exists()

        const user = {
          name: 'olaf'
        }

        hemera.act({
          topic: 'arango-store',
          cmd: 'executeAqlQuery',
          type: 'one',
          databaseName: 'test4',
          query: aql `INSERT ${user} INTO users`
        }, function (err, resp) {

          expect(err).to.be.not.exists()

          done()
        })

      })
    })
  })

  it('Execute AQL Query with multiple returns', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test5'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      hemera.act({
        topic: 'arango-store',
        cmd: 'createCollection',
        name: 'users',
        databaseName: 'test5'
      }, (err, resp) => {

        expect(err).to.be.not.exists()

        hemera.act({
          topic: 'arango-store',
          cmd: 'executeAqlQuery',
          type: 'all',
          databaseName: 'test5',
          query: `
            FOR u IN users
            RETURN u
            `
        }, function (err, resp) {

          expect(err).to.be.not.exists()

          done()
        })

      })
    })
  })

  it('Execute Transaction', function (done) {

    hemera.act({
      topic: 'arango-store',
      cmd: 'createDatabase',
      name: 'test6'
    }, (err, resp) => {

      expect(err).to.be.not.exists()

      hemera.act({
        topic: 'arango-store',
        cmd: 'createCollection',
        name: 'users',
        databaseName: 'test6'
      }, (err, resp) => {

        expect(err).to.be.not.exists()

        var action = String(function () {
          return true
        })

        hemera.act({
          topic: 'arango-store',
          cmd: 'executeTransaction',
          databaseName: 'test6',
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
  })

})
