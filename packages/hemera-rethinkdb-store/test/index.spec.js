'use strict'

const Hemera = require('./../../hemera')
const HemeraRethinkdbStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Code = require('code')
const Nats = require('nats')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Hemera-rethinkdb-store', function () {
  let PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT

  let server
  let hemera
  let testDatabase = 'test'
  let testCollection = 'users'
  let topic = 'rethinkdb-store'

  function bootstrap (done) {
    hemera.act({
      topic,
      cmd: 'createTable',
      collection: 'users'
    }, function (err, resp) {
      if (err) throw err
      done()
    })
  }

  function clean (done) {
    hemera.act({
      topic,
      cmd: 'removeTable',
      collection: 'users'
    }, function (err, resp) {
      if (err) throw err
      done()
    })
  }

  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, () => {
      const nats = Nats.connect(authUrl)
      hemera = new Hemera(nats, {
        crashOnFatal: false,
        logLevel: 'debug'
      })
      hemera.use(HemeraJoi)
      hemera.use(HemeraRethinkdbStore, {
        rethinkdb: {
          db: testDatabase
        }
      })
      hemera.ready(function () {
        bootstrap(done)
      })
    })
  })

  after(function (done) {
    clean(() => {
      hemera.close()
      server.kill()
      done()
    })
  })

  it('Create', function (done) {
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

      done()
    })
  })

  it('Find', function (done) {
    hemera.act({
      topic,
      cmd: 'find',
      collection: testCollection,
      query: {}
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.array()

      done()
    })
  })

  it('findById', function (done) {
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
        cmd: 'findById',
        collection: testCollection,
        id: resp.generated_keys[0]
      }, function (err, resp2) {
        expect(err).to.be.not.exists()
        expect(resp2).to.be.an.object()
        expect(resp2.name).to.be.equals('peter')
        expect(resp2.id).to.be.equals(resp.generated_keys[0])
        done()
      })
    })
  })

  it('Update', function (done) {
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
          name: 'peter2'
        },
        query: {
          id: resp.generated_keys[0]
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.replaced).to.be.equals(1)
        done()
      })
    })
  })

  it('UpdateById', function (done) {
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
          name: 'peter2'
        },
        id: resp.generated_keys[0]
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.replaced).to.be.equals(1)
        done()
      })
    })
  })

  it('Remove', function (done) {
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
        cmd: 'remove',
        collection: testCollection,
        data: {
          name: 'peter2'
        },
        query: {
          id: resp.generated_keys[0]
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.deleted).to.be.equals(1)
        done()
      })
    })
  })

  it('RemoveById', function (done) {
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
        cmd: 'removeById',
        collection: testCollection,
        data: {
          name: 'peter2'
        },
        id: resp.generated_keys[0]
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.deleted).to.be.equals(1)
        done()
      })
    })
  })

  it('Replace', function (done) {
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
        cmd: 'replace',
        collection: testCollection,
        data: {
          id: resp.generated_keys[0],
          name: 'peter2'
        },
        query: {
          id: resp.generated_keys[0]
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.replaced).to.be.equals(1)
        done()
      })
    })
  })

  it('ReplaceById', function (done) {
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
        cmd: 'replaceById',
        collection: testCollection,
        data: {
          id: resp.generated_keys[0],
          name: 'peter2'
        },
        id: resp.generated_keys[0]
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.replaced).to.be.equals(1)
        done()
      })
    })
  })

  it.skip('Changes', function (done) {
    hemera.act({
      topic,
      cmd: 'changes',
      collection: testCollection,
      maxMessages: -1
    }, function (err, resp) {
      if (resp !== true) {
        console.log(resp)
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
      }
    })

    setTimeout(() => {
      hemera.act({
        topic,
        cmd: 'create',
        collection: testCollection,
        data: {
          name: 'peter2'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
      })
    }, 1000)
  })
})
