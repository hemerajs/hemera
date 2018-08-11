'use strict'

const split = require('split2')

describe('Error logs', function() {
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

  it('Should log an error when no native error object was passed in server action', function(done) {
    const nats = require('nats').connect(authUrl)
    const stream = split(JSON.parse)
    const hemera = new Hemera(nats, {
      logLevel: 'error',
      logger: stream,
      timeout: 25
    })
    const logs = []

    stream.on('data', line => {
      logs.push(line)
    })

    hemera.ready(() => {
      // to prevent uncaught error
      hemera.on('error', () => {})

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (req, done) => done('test', null)
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(resp).to.be.undefined()
          expect(logs[0].msg).to.be.equals(
            `Response error must be derivated from type 'Error' but got 'string'`
          )
          hemera.close(done)
        }
      )
    })
  })
})
