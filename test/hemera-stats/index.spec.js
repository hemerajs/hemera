'use strict'

const Hemera = require('../../packages/hemera')
const HemeraStats = require('../../packages/hemera-stats')
const HemeraJoi = require('../../packages/hemera-joi')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0)

describe('Hemera-stats', function () {
  const PORT = 6243
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

  it('Should be able to get process informations about the hemera process', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'info' })

    hemera.use(HemeraStats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      hemera.act({
        topic: 'stats',
        cmd: 'processInfo'
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.eventLoopDelay).to.be.exists()
        expect(resp.rss).to.be.exists()
        expect(resp.app).to.be.exists()
        expect(resp.nodeEnv).to.be.exists()
        expect(resp.uptime).to.be.exists()
        expect(resp.ts).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to get a list of all registered server actions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'info' })

    hemera.use(HemeraStats)
    hemera.use(HemeraJoi)

    hemera.ready(() => {
      let Joi = hemera.exposition['hemera-joi'].joi

      hemera.add({
        topic: 'math',
        cmd: 'add',
        a: Joi.number().required()
          .default(33)
          .description('this key will match anything you give it')
          .notes(['this is special', 'this is important'])
          .example(1)
      }, (req, cb) => {
        cb(null, req.a + req.b)
      })

      hemera.act({
        topic: 'stats',
        cmd: 'registeredActions'
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.actions).to.be.an.array()
        expect(resp.ts).to.be.exists()
        expect(resp.actions[2].schema).to.be.an.object()
        expect(resp.actions[2].schema.a.required).to.be.equals(true)
        expect(resp.actions[2].schema.a.default).to.be.equals(33)
        expect(resp.actions[2].schema.a.description).to.be.equals('this key will match anything you give it')
        expect(resp.actions[2].schema.a.notes).to.be.equals(['this is special', 'this is important'])
        expect(resp.actions[2].schema.a.examples).to.be.equals([1])
        expect(resp.app).to.be.exists()
        hemera.close()
        done()
      })
    })
  })
})
