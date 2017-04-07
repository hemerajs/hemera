'use strict'

const Code = require('code')
const Transport = require('./../../lib/transports/http-batch')
const FakeServer = require('./../fake-server')

const expect = Code.expect

const FAKE_SERVER_PORT = 9090

const options = {
  port: FAKE_SERVER_PORT,
  host: '127.0.0.1',
  path: '/api/v1/spans',
  batchSize: 2,
  batcheTimeout: 100
}

describe('Transports', function () {
  describe('http-batch', function () {
    let fakeServer

    before(function (done) {
      fakeServer = FakeServer(FAKE_SERVER_PORT, done)
    })

    beforeEach(function (done) {
      fakeServer.reset()
      done()
    })

    after(function (done) {
      fakeServer.stop()
      done()
    })

    it('sends received data to the correct url in batches', function (done) {
      fakeServer.on('request', function (data) {
        var expectedBatchSize = 2

        expect(data.url).to.equal('/api/v1/spans')
        expect(data.body).to.be.an.array()
        expect(data.body).to.have.length(expectedBatchSize)
        expect(data.body[0]).to.equal({
          traceId: 'test trace',
          id: 'test span'
        })
        expect(data.body[1]).to.equal({
          traceId: 'test trace 2',
          id: 'test span 2'
        })

        done()
      })

      Transport({
        traceId: 'test trace',
        id: 'test span'
      }, options)
      Transport({
        traceId: 'test trace 2',
        id: 'test span 2'
      }, options)
    })

    it('sends queued data on inactivity', function (done) {
      fakeServer.on('request', function (data) {
        expect(data.url).to.equal('/api/v1/spans')
        expect(data.body).to.be.an.array()
        expect(data.body).to.have.length(1)
        expect(data.body[0]).to.equal({
          traceId: 'test trace 3',
          id: 'test span 3'
        })

        done()
      })

      Transport({
        traceId: 'test trace 3',
        id: 'test span 3'
      }, options)
    })
  })
})
