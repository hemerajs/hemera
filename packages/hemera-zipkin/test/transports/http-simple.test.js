'use strict'

const Lab = require('lab')
const Code = require('code')
const Transport = require('./../../lib/transports/http-simple')
const FakeServer = require('./../fake-server')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const FAKE_SERVER_PORT = 9090

const options = {
  port: FAKE_SERVER_PORT,
  host: '127.0.0.1',
  path: '/api/v1/spans'
}

describe('Transports', function () {

  describe('http-simple', function () {

    let fakeServer

    lab.before(function (done) {
      fakeServer = FakeServer(FAKE_SERVER_PORT, done)
    })

    lab.beforeEach(function (done) {
      fakeServer.reset()
      done()
    })

    lab.after(function (done) {
      fakeServer.stop()
      done()
    })

    it('sends received data to the correct url', function (done) {

      fakeServer.on('request', function (data) {

        expect(data.url).to.equal('/api/v1/spans')
        expect(data.body).to.be.an.array()
        expect(data.body).to.have.length(1)
        expect(data.body[0]).to.equal({
          traceId: 'test trace',
          id: 'test span'
        })

        done()
      })

      Transport({
        traceId: 'test trace',
        id: 'test span'
      }, options)

    })

  })

})
