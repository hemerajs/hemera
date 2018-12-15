/* eslint node/no-unsupported-features: 0 */
'use strict'

describe('Middleware Async / Await', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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
