'use strict'

const split = require('split2')

describe('Tracing logs', function() {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    server.kill()
  })

  it('Should log request and response logs', function(done) {
    const nats = require('nats').connect(authUrl)
    const stream = split(JSON.parse)
    const hemera = new Hemera(nats, {
      logLevel: 'debug',
      logger: stream
    })

    const logs = []

    stream.on('data', line => {
      logs.push(line)
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => Promise.resolve(req.a + req.b)
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(logs.length).to.be.equals(6)

          expect(logs[2].msg).to.be.equals('Request started')
          expect(logs[2].requestId).to.be.exists()
          expect(logs[2].pattern).to.be.exists()

          expect(logs[3].msg).to.be.equals('Request received')
          expect(logs[3].requestId).to.be.exists()
          expect(logs[3].pattern).to.be.exists()

          expect(logs[4].msg).to.be.equals('Request responded')
          expect(logs[4].requestId).to.be.exists()
          expect(logs[4].pattern).to.be.exists()

          expect(logs[5].msg).to.be.equals('Request completed')
          expect(logs[5].requestId).to.be.exists()
          expect(logs[5].pattern).to.be.exists()
          expect(logs[5].responseTime).to.be.number()
          hemera.close(done)
        }
      )
    })
  })

  it('Should log detailed request and response logs', function(done) {
    const nats = require('nats').connect(authUrl)
    const stream = split(JSON.parse)
    const hemera = new Hemera(nats, {
      logLevel: 'debug',
      logger: stream,
      traceLog: true,
      tag: 'tag'
    })

    const logs = []

    stream.on('data', line => {
      logs.push(line)
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => Promise.resolve(req.a + req.b)
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(logs.length).to.be.equals(6)

          expect(logs[2].msg).to.be.equals('Request started')
          expect(logs[2].requestId).to.be.exists()
          expect(logs[2].pattern).to.be.exists()
          expect(logs[2].traceId).to.be.exists()
          expect(logs[2].spanId).to.be.exists()
          expect(logs[2].tag).to.be.equals('tag')

          expect(logs[3].msg).to.be.equals('Request received')
          expect(logs[3].requestId).to.be.exists()
          expect(logs[3].pattern).to.be.exists()
          expect(logs[3].traceId).to.be.exists()
          expect(logs[3].spanId).to.be.exists()
          expect(logs[3].tag).to.be.equals('tag')

          expect(logs[4].msg).to.be.equals('Request responded')
          expect(logs[4].requestId).to.be.exists()
          expect(logs[4].pattern).to.be.exists()
          expect(logs[4].traceId).to.be.exists()
          expect(logs[4].spanId).to.be.exists()
          expect(logs[4].tag).to.be.equals('tag')

          expect(logs[5].msg).to.be.equals('Request completed')
          expect(logs[5].requestId).to.be.exists()
          expect(logs[5].pattern).to.be.exists()
          expect(logs[5].traceId).to.be.exists()
          expect(logs[5].spanId).to.be.exists()
          expect(logs[5].responseTime).to.be.number()
          expect(logs[5].tag).to.be.equals('tag')
          hemera.close(done)
        }
      )
    })
  })
})
