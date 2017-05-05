'use strict'

const Hemera = require('./../../hemera')
const Nats = require('nats')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
const expect = Code.expect

describe('Hemera-controlplane', function () {
  let PORT = 4222
  let noAuthUrl = 'nats://localhost:' + PORT
  const topic = 'controlplane'
  const service = 'math'
  let server
  let hemera

  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, {}, () => {
      const nats = Nats.connect(noAuthUrl)
      hemera = new Hemera(nats, {
        logLevel: 'info'
      })

      hemera.ready(() => {
        done()
      })
    })
  })

  after(function (done) {
    hemera.close()
    server.kill()
    done()
  })

  it('Should scale up a worker', function (done) {
    hemera.act({
      topic,
      cmd: 'scaleUp',
      service
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.success).to.be.equals(true)
      expect(resp.pid).to.be.number()

      done()
    })
  })
  it('Should scale down a worker', function (done) {
    hemera.act({
      topic,
      cmd: 'scaleUp',
      service
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.success).to.be.equals(true)
      expect(resp.pid).to.be.number()

      hemera.act({
        topic,
        cmd: 'scaleDown',
        service
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.an.object()
        expect(resp.success).to.be.equals(true)
        expect(resp.pid).to.be.number()

        done()
      })
    })
  })
  it('Should kill a worker by PID', function (done) {
    hemera.act({
      topic,
      cmd: 'scaleUp',
      service
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.success).to.be.equals(true)
      expect(resp.pid).to.be.number()

      hemera.act({
        topic,
        cmd: 'killByPid',
        service,
        pid: resp.pid
      }, function (err2, resp2) {
        expect(err2).to.be.not.exists()
        expect(resp2).to.be.an.object()
        expect(resp.success).to.be.equals(true)

        done()
      })
    })
  })
  it('Should get list of all workers', function (done) {
    hemera.act({
      topic,
      cmd: 'scaleUp',
      service
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.success).to.be.equals(true)
      expect(resp.pid).to.be.number()

      hemera.act({
        topic,
        cmd: 'list',
        service
      }, function (err2, resp2) {
        expect(err2).to.be.not.exists()
        expect(resp2).to.be.an.object()
        expect(resp2.success).to.be.equals(true)
        expect(resp2.list).to.be.an.array()

        done()
      })
    })
  })
  it('Should down all workers', function (done) {
    hemera.act({
      topic,
      cmd: 'scaleUp',
      service
    }, function (err, resp) {
      expect(err).to.be.not.exists()
      expect(resp).to.be.an.object()
      expect(resp.success).to.be.equals(true)
      expect(resp.pid).to.be.number()

      hemera.act({
        topic,
        cmd: 'down',
        service
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp.success).to.be.equals(true)

        hemera.act({
          topic,
          cmd: 'list',
          service
        }, function (err2, resp2) {
          expect(err2).to.be.not.exists()
          expect(resp2).to.be.an.object()
          expect(resp2.success).to.be.equals(true)
          expect(resp2.list).to.be.an.array()

          done()
        })
      })
    })
  })
})
