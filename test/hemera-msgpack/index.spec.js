'use strict'

const HemeraMsgpack = require('../../packages/hemera-msgpack')

describe('Hemera-msgpack', function () {
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

  it('encode and decode', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraMsgpack)

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
        hemera.close(done)
      })
    })
  })

  it('encode and decode complex type', function (done) {
    const nats = require('nats').connect({
      url: authUrl,
      preserveBuffers: true
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraMsgpack)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          buffer: resp.c,
          result: resp.a + resp.b,
          d: resp.d
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        c: Buffer.from('test'),
        d: { foo: true }
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp.result).to.be.equals(3)
        expect(Buffer.isBuffer(resp.buffer)).to.be.equals(true)
        expect(resp.d).to.be.equals({ foo: true })
        hemera.close(done)
      })
    })
  })
})
