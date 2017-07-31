'use strict'

const HemeraAvro = require('../../packages/hemera-avro')

describe('Hemera-avro', function () {
  const PORT = 6243
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

  it('encode and decode without payload schema', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close(done)
      })
    })
  })

  it('encode and decode complex type without payload schema', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb(null, {
          result: resp.a + resp.b + resp.c.a
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        c: {
          a: 2222
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.equals(2225)
        hemera.close(done)
      })
    })
  })

  it('encode and decode with payload schema', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      let Avro = hemera.exposition['hemera-avro'].avro

      const type = Avro.parse({
        name: 'SumResult',
        type: 'record',
        fields: [{
          name: 'result',
          type: 'int'
        }]
      })

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, function (resp, cb) {
        cb(null, {
          result: resp.a + resp.b + resp.c.a
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        c: {
          a: 2222
        },
        avro$: type
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.equals(2225)
        hemera.close(done)
      })
    })
  })

  it('Should lead to schema error', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      let Avro = hemera.exposition['hemera-avro'].avro

      const type = Avro.parse({
        name: 'SumResult',
        type: 'record',
        fields: [{
          name: 'result',
          type: 'string'
        }]
      })

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, function (resp, cb) {
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
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraParseError')
        expect(err.message).to.be.equals('Invalid payload')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('truncated buffer')

        hemera.close(done)
      })
    })
  })

  it('Should lead to decode error', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      let Avro = hemera.exposition['hemera-avro'].avro

      const type = Avro.parse({
        name: 'SumResult',
        type: 'record',
        fields: [{
          name: 'result',
          type: 'int'
        }]
      })

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, function (resp, cb) {
        cb(new Error('test'))
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        avro$: type
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')

        hemera.close(done)
      })
    })
  })

  it('Should be able to decode custom error', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    const CustomError = hemera.createError('Custom')

    hemera.use(HemeraAvro)

    hemera.ready(() => {
      let Avro = hemera.exposition['hemera-avro'].avro

      const type = Avro.parse({
        name: 'SumResult',
        type: 'record',
        fields: [{
          name: 'result',
          type: 'int'
        }]
      })

      hemera.add({
        topic: 'math',
        cmd: 'add',
        avro$: type
      }, function (resp, cb) {
        const error = new CustomError('test')
        error.details = { foo: 'bar' }
        error.code = 500
        error.statusCode = 500
        cb(error)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        avro$: type
      }, function (err, resp) {
        expect(err.name).to.be.equals('Custom')
        expect(err.code).to.be.equals(500)
        expect(err.statusCode).to.be.equals(500)
        expect(err.details).to.be.equals({ foo: 'bar' })
        expect(err.message).to.be.equals('test')
        expect(err.hops).to.be.an.array()
        expect(err.hops[0].service).to.be.exists()
        expect(err.hops[0].method).to.be.exists()
        expect(err.hops[0].app).to.be.exists()
        expect(err.hops[0].ts).to.be.exists()

        hemera.close(done)
      })
    })
  })
})
