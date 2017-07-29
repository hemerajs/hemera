'use strict'

describe('Unsubscribe NATS topic', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to unsubscribe a NATS topic', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      const result = hemera.remove('topic:math,cmd:add')

      expect(hemera.topics.math).to.be.not.exists()
      expect(hemera.list().length).to.be.equals(0)
      expect(result).to.be.equals(true)
      hemera.close()
      done()
    })
  })

  it('Should be able to unsubscribe with literal syntax', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      const result = hemera.remove({ topic: 'math', cmd: 'add' })

      expect(hemera.topics.math).to.be.not.exists()
      expect(hemera.list().length).to.be.equals(0)
      expect(result).to.be.equals(true)
      hemera.close()
      done()
    })
  })

  it('Should be able to unsubscribe multiple pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: false // avoid throwing duplicate pattern error
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'add',
        a: {
          b: 1
        }
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      const result = hemera.remove('topic:math,cmd:add')

      expect(hemera.topics.math).to.be.not.exists()
      expect(hemera.list().length).to.be.equals(0)
      expect(result).to.be.equals(true)
      hemera.close()
      done()
    })
  })

  it('Should not be able to unsubscribe a NATS topic because topic si required', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      try {
        hemera.remove('cmd:add')
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Topic is required to remove a pattern')
        hemera.close()
        done()
      }
    })
  })

  it('Should return false when topic was not found', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      const result = hemera.remove('topic:math1')
      expect(hemera.topics.math1).to.be.not.exists()
      expect(result).to.be.equals(false)
      hemera.close()
      done()
    })
  })

  it('Should be able to unsubscribe a subscription id', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        maxMessages$: -1
      }, function (err, resp) {
        expect(err).to.be.not.exists()

        const result = hemera.remove(this._sid)
        expect(result).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to unsubscribe all at once', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'order',
        cmd: 'create'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'math',
        cmd: 'add'
      }, function (err, resp) {
        expect(err).to.be.not.exists()

        hemera.removeAll()
        expect(Object.keys(hemera.topics).length).to.be.equals(0)
        expect(hemera.list().length).to.be.equals(0)
        hemera.close()
        done()
      })
    })
  })
})
