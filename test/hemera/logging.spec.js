'use strict'

const split = require('split2')

describe('Logging interface', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

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

    hemera.ready(() => {
      expect(logSpy.called).to.be.equals(true)
      logSpy.restore()
      hemera.close(done)
    })
  })

  it('Should validate custom logger', function(done) {
    const nats = require('nats').connect(authUrl)

    try {
      // eslint-disable-next-line no-new
      new Hemera(nats, {
        logger: null
      })
    } catch (err) {
      expect(err).to.be.exists()
      expect(err.message).to.be.equals(
        'child "logger" fails because ["logger" must be an object, "logger" must be an object]'
      )
      nats.close()
      done()
    }
  })

  it('Should attach trace context to each logs', function(done) {
    const nats = require('nats').connect(authUrl)
    const stream = split(JSON.parse)
    const hemera = new Hemera(nats, {
      logLevel: 'debug',
      logger: stream,
      traceLog: true
    })

    const logs = []

    stream.on('data', line => {
      logs.push(line)
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => Promise.resolve(req.a + req.b)
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          this.log.info({ foo: 'bar' }, 'test')
          expect(logs.length).to.be.equals(7)
          expect(logs[6].msg).to.be.equals('test')
          expect(logs[6].requestId).to.be.exists()
          expect(logs[6].traceId).to.be.exists()
          expect(logs[6].spanId).to.be.exists()
          expect(logs[6].foo).to.be.equals('bar')
          hemera.close(done)
        }
      )
    })
  })
})
