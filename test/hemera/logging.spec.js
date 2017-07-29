'use strict'

describe('Logging interface', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to use custom logger', function (done) {
    const nats = require('nats').connect(authUrl)

    var logSpy = Sinon.spy()

    let logger = {
      debug: function () {},
      info: function () {
        logSpy()
      },
      fatal: function () {}
    }

    const hemera = new Hemera(nats, {
      logger
    })

    hemera.log.info('test')

    expect(logSpy.called).to.be.equals(true)
    hemera.close()
    done()
  })

  it('Should be able to log with default logger', function (done) {
    const nats = require('nats').connect(authUrl)
    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    var logSpy = Sinon.spy(hemera.log, 'info')

    hemera.log.info('test')

    expect(logSpy.called).to.be.equals(true)
    logSpy.restore()
    hemera.close()
    done()
  })

  it('Should be able to log with none pretty logger', function (done) {
    const nats = require('nats').connect(authUrl)
    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      prettyLog: false
    })

    var logSpy = Sinon.spy(hemera.log, 'info')

    hemera.log.info('test')

    expect(logSpy.called).to.be.equals(true)
    logSpy.restore()
    hemera.close()
    done()
  })
})
