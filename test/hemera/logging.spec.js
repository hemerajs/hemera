'use strict'

describe('Logging interface', function () {
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

  it('Should be able to use custom logger', function (done) {
    const nats = require('nats').connect(authUrl)

    let logger = {
      info: function () {},
      fatal: function () {}
    }

    var logSpy = Sinon.spy(logger, 'info')

    const hemera = new Hemera(nats, {
      logger
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).not.to.be.equals(3)
        expect(logSpy.called).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })
})