'use strict'

describe('Pattern matching', function () {
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

  it('Should throw an error when the pattern is already defined', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add({
          topic: 'TOPIC',
          cmd: 'CMD'
        }, (err, next) => {
          expect(err).to.be.not.exists()
          next()
        })
        hemera.add({
          topic: 'TOPIC',
          cmd: 'CMD',
          type: 'TYPE1'
        }, (err, next) => {
          expect(err).to.be.not.exists()
          next()
        })
        hemera.add({
          topic: 'TOPIC',
          cmd: 'CMD',
          type: 'TYPE2'
        }, (err, next) => {
          expect(err).to.be.not.exists()
          next()
        })
      } catch (e) {
        expect(e.name).to.be.equals('HemeraError')
        expect(e.message).to.be.equals('Pattern is already in use')
        hemera.close()
        done()
      }
    })
  })

  it('Should not throw an error when a pattern is a subset of another', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: false
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE1'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.close()
      done()
    })
  })

  it('Pattern matching in insertion order', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: false,
        indexing: 'insertion'
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE1'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })

      const a = hemera.router.lookup({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      })

      expect(a.actMeta.pattern).to.be.equals({
        topic: 'TOPIC',
        cmd: 'CMD'
      })

      hemera.close()
      done()
    })
  })

  it('Should not send config $ variables', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD'
      }, function (err, next) {
        expect(this._pattern).to.be.equals({
          topic: 'TOPIC',
          cmd: 'CMD',
          a: {
            b: 1
          }
        })
        next()
      })
      hemera.act({
        topic: 'TOPIC',
        cmd: 'CMD',
        a: {
          b: 1
        },
        timeout$: 5000
      }, function (err, resp) {
        hemera.close()
        done()
      })
    })
  })

  it('Pattern matching in depth order', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: false,
        indexing: 'depth'
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE1'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })
      hemera.add({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      }, (err, next) => {
        expect(err).to.be.not.exists()
        next()
      })

      const a = hemera.router.lookup({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      })

      expect(a.actMeta.pattern).to.be.equals({
        topic: 'TOPIC',
        cmd: 'CMD',
        type: 'TYPE2'
      })

      hemera.close()
      done()
    })
  })
})
