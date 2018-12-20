'use strict'

describe('onError extension', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to add onError extension handler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let spy = Sinon.spy()
    hemera.ext('onError', (hemera, payload, error, next) => {
      expect(hemera).to.be.an.instanceof(Hemera)
      expect(error).to.be.an.instanceof(Error)
      spy()
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Error('test'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to define different handlers in plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spyPlugin1ExtensionHandler = Sinon.spy()
    const spyPlugin2ExtensionHandler = Sinon.spy()

    let plugin1 = function(hemera, options, done) {
      hemera.ext('onError', (hemera, paylaod, error, next) => {
        expect(error).to.be.an.instanceof(Error)
        spyPlugin1ExtensionHandler()
        next()
      })

      hemera.add(
        {
          cmd: 'foo',
          topic: 'math'
        },
        (resp, cb) => {
          cb(new Error('plugin1'))
        }
      )

      done()
    }

    hemera.use(plugin1)

    let plugin2 = function(hemera, options, done) {
      hemera.ext('onError', (hemera, paylaod, error, next) => {
        spyPlugin2ExtensionHandler()
        next()
      })

      hemera.add(
        {
          cmd: 'bar',
          topic: 'math'
        },
        (resp, cb) => {
          cb()
        }
      )

      done()
    }

    hemera.use(plugin2)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'foo'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(spyPlugin1ExtensionHandler.calledOnce).to.be.equals(true)
          expect(spyPlugin2ExtensionHandler.called).to.be.equals(false)
          hemera.close(done)
        }
      )
    })
  })

  it('Should call error hander first before onError extension', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let spy = Sinon.spy()
    let errorHandlerSpy = Sinon.spy()

    hemera.setErrorHandler((hemera, error, reply) => {
      expect(error).to.be.an.instanceof(Error)
      errorHandlerSpy()
    })
    hemera.ext('onError', (hemera, payload, error, next) => {
      expect(hemera).to.be.an.instanceof(Hemera)
      expect(error).to.be.an.instanceof(Error)
      spy()
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb(new Error('test'))
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(spy.calledOnce).to.be.equals(true)
          expect(spy.calledAfter(errorHandlerSpy)).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
