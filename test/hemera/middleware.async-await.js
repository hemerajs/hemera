'use strict'

describe('Middleware Async / Await', function() {
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

  it('Should be able to return promise', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'info' })

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(async function(req, resp) {
          await Promise.resolve('test')
        })
        .end(async req => req.a + req.b)

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })
})
