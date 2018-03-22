'use strict'

describe('Error comparison', function() {
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

  it('Should be able to compare errors with instanceof from different instances', function() {
    const nats = require('nats').connect(authUrl)
    const nats2 = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const UnauthorizedError = Hemera.createError('Unauthorized')

    const hemera2 = new Hemera(nats2)
    const UnauthorizedError2 = Hemera.createError('Unauthorized')

    return hemera
      .ready()
      .then(() => hemera2.ready())
      .then(() => {
        hemera.add(
          {
            topic: 'a',
            cmd: 'a'
          },
          function(resp, cb) {
            cb(new UnauthorizedError('test'))
          }
        )

        return hemera
          .act({
            topic: 'a',
            cmd: 'a'
          })
          .catch(err => {
            expect(err).to.be.exists()
            expect(err instanceof UnauthorizedError2).to.be.equals(true)
            return hemera.close()
          })
      })
  })
})
