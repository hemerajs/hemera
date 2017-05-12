'use strict'

describe('Quick syntax for JSON objects', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to use a string as pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add('topic:math,cmd:add', (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act('topic:math,cmd:add,a:1,b:2', (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.close()
        done()
      })
    })
  })
})