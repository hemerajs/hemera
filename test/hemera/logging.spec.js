'use strict'

const split = require('split2')

describe('Logging interface', function() {
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

  it('Should be able to use custom logger', function(done) {
    const nats = require('nats').connect(authUrl)

    class Logger {
      info(msg) {
        console.log(msg)
      }
      debug(msg) {
        console.log(msg)
      }
      error(msg) {
        console.error(msg)
      }
      warn(msg) {
        console.warn(msg)
      }
      fatal(msg) {
        console.error(msg)
      }
      trace(msg) {
        console.log(msg)
      }
    }

    const hemera = new Hemera(nats, {
      logger: new Logger()
    })

    hemera.close(done)
  })

  it('Should be able to log with default logger', function(done) {
    const nats = require('nats').connect(authUrl)
    const stream = split(JSON.parse)
    const hemera = new Hemera(nats, {
      logLevel: 'info',
      logger: stream
    })

    stream.once('data', line => {
      expect(line.msg).to.be.equals('Connected!')
      hemera.close(done)
    })

    hemera.ready()
  })

  it('Should be able to log with none pretty logger', function(done) {
    const nats = require('nats').connect(authUrl)
    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      prettyLog: false
    })

    var logSpy = Sinon.spy(hemera.log, 'info')

    hemera.log.info('test')

    expect(logSpy.called).to.be.equals(true)
    logSpy.restore()
    hemera.close(done)
  })

  it('Should validate custom logger', function(done) {
    const nats = require('nats').connect(authUrl)

    try {
      // eslint-disable-next-line no-new
      new Hemera(nats, {
        logger: {}
      })
    } catch (err) {
      expect(err).to.be.exists()
      expect(err.message).to.be.equals(
        'child "logger" fails because [child "info" fails because ["info" is required], "logger" must be an instance of "Stream"]'
      )
      nats.close()
      done()
    }
  })
})
