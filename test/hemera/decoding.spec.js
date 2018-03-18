'use strict'

describe('Default JSON decoder', function() {
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

  it('Should pass decoding context', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const calls = []

    hemera.setDecoder((msg, isServerEncoding) => {
      calls.push(isServerEncoding)
      return {
        value: JSON.parse(msg)
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (req, cb) => {
          cb(null, req.a + req.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, res) {
          expect(err).to.be.not.exists()
          expect(res).to.be.equals(3)
          expect(calls).to.be.equals([true, false]) // Server -> Client
          hemera.close(done)
        }
      )
    })
  })
})
