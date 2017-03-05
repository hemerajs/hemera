'use strict'

const Hemera = require('./../../hemera')
const HemeraMongoStore = require('./../index')
const Nats = require('nats')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Hemera-mongo-store', function () {
  let PORT = 6243
  let noAuthUrl = 'nats://localhost:' + PORT

  let server
  let hemera

  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, {}, () => {
      const nats = Nats.connect(noAuthUrl)
      hemera = new Hemera(nats)
      hemera.use(HemeraMongoStore)
      hemera.ready(done)
    })
  })

  after(function (done) {
    hemera.close()
    server.kill()
    done()
  })

  it('Create', function (done) {
    done()
  })
})
