'use strict'

describe('Load policy for server component', function () {
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

  it('Should throw an ProcessLoadError with (Server under heavy load)', function (done) {
    const nats = require('nats').connect(authUrl)
    let respondedSpy = Sinon.spy()
    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      load: {
        checkPolicy: true,
        process: {
          sampleInterval: 1
        },
        policy: {
          maxRssBytes: 5
        }
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        cb()
        respondedSpy()
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(respondedSpy.called).to.be.equals(false)
        expect(err instanceof Hemera.errors.ProcessLoadError).to.be.equals(true)
        expect(err.heapUsed).to.be.exists()
        expect(err.rss).to.be.least(5)
        expect(err.heapUsed).to.be.exists()
        expect(err.message).to.be.equals('Server under heavy load (rss)')
        hemera.close()
        done()
      })
    })
  })
})
