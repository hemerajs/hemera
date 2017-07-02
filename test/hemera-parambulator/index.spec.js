'use strict'

const HemeraParambulator = require('../../packages/hemera-parambulator')

describe('Hemera-parambulator', function () {
  const PORT = 6244
  const flags = ['--user', 'derek', '--pass', 'foobar']
  const authUrl = 'nats://derek:foobar@localhost:' + PORT
  let server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to use parambulator as payload validator', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraParambulator)
    hemera.setOption('payloadValidator', 'hemera-parambulator')

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send',
        a: {
          type$: 'number'
        }
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        a: '1'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('PreValidationError')
        expect(err.message).to.be.equals('The value "1" is not of type \'number\' (parent: a).')
        expect(err.details).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to modify the payload', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraParambulator)
    hemera.setOption('payloadValidator', 'hemera-parambulator')

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send',
        a: {
          default$: 'hello'
        }
      }, (resp, cb) => {
        cb(null, resp.a)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send'
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals('hello')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to pass the full schema to the action', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use(HemeraParambulator)
    hemera.setOption('payloadValidator', 'hemera-parambulator')

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send',
        pb$: {
          a: {
            type$: 'number'
          }
        }
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        a: '1'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('PreValidationError')
        expect(err.message).to.be.equals('The value "1" is not of type \'number\' (parent: a).')
        expect(err.details).to.be.exists()
        hemera.close()
        done()
      })
    })
  })
})
