'use strict'

const Hemera = require('../../packages/hemera'),
  HemeraAvro = require('../../packages/hemera-avro'),
  Util = require('../../packages/hemera/build/util'),
  Avro = require('avsc'),
  Code = require('code'),
  Sinon = require('sinon'),
  HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0);

describe('Hemera-avro', function () {

  var PORT = 6243
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('encode and decode', function (done) {

    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats, {
      crashOnFatal: false,
      logLevel: 'info'
    })

    hemera.use(HemeraAvro)

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {

        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('encode and decode complex type', function (done) {

    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraAvro)

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
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp.result).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('encode and decode with schema', function (done) {

    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraAvro)

    const type = Avro.parse({
      name: 'SumResult',
      type: 'record',
      fields: [{
        name: 'result',
        type: 'int'
      }]
    })

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, (resp, cb) => {

        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        avro$: type
      }, (err, resp) => {

        expect(err).to.be.not.exists()
        expect(resp.result).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('schema error', function (done) {

    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraAvro)

    const type = Avro.parse({
      name: 'SumResult',
      type: 'record',
      fields: [{
        name: 'result',
        type: 'string'
      }]
    })

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, (resp, cb) => {

        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        avro$: type
      }, (err, resp) => {

        expect(err).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

})