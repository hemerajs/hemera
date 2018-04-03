'use strict'

describe('Extension onAdd', function() {
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

  it('Should be able to listen for "onAdd" events', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onAdd', function(addDefinition) {
        expect(addDefinition.pattern).to.be.equals({
          topic: 'email',
          cmd: 'send'
        })
        expect(addDefinition.action).to.be.function()
        expect(addDefinition.transport).to.be.object()
        expect(addDefinition.schema).to.be.object()
        expect(addDefinition.sid).to.be.number()
        hemera.close(done)
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )
    })
  })

  it('Should call "onAdd" extension for each add registration', function(done) {
    const nats = require('nats').connect(authUrl)

    let ext1 = Sinon.spy()
    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onAdd', function(addDefinition) {
        expect(addDefinition.action).to.be.function()
        expect(addDefinition.transport).to.be.object()
        expect(addDefinition.pattern).to.be.object()
        expect(addDefinition.schema).to.be.object()
        expect(addDefinition.sid).to.be.number()
        ext1()
      })

      for (let i = 0; i < 10; i++) {
        hemera.add(
          {
            topic: 'email',
            cmd: 'send_' + i
          },
          (resp, cb) => {
            cb()
          }
        )
      }
      expect(ext1.callCount).to.be.equals(10)
      hemera.close(done)
    })
  })

  it('Should throw when an "onAdd" handler is not a function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.ext('onAdd', '')
      } catch (e) {
        expect(e.message).to.be.equals('Extension handler must be a function')
        done()
      }
    })
  })

  it('Should be able to add "onAdd" events inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    let ext1 = Sinon.spy()
    const hemera = new Hemera(nats)

    hemera.ext('onAdd', function(addDefinition) {
      expect(addDefinition.pattern).to.be.equals({
        topic: 'email',
        cmd: 'send'
      })
      expect(addDefinition.action).to.be.function()
      ext1()
    })

    let plugin = function(hemera, options, done) {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )
      done()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(ext1.called).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should be able to listen for "onAdd" events inside plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    let ext1 = Sinon.spy()
    const hemera = new Hemera(nats)

    let plugin = function(hemera, options, done) {
      hemera.ext('onAdd', function(addDefinition) {
        expect(addDefinition.pattern).to.be.equals({
          topic: 'email',
          cmd: 'send'
        })
        expect(addDefinition.action).to.be.function()
        ext1()
      })

      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )
      done()
    }

    plugin[Symbol.for('name')] = 'myPlugin'

    hemera.use(plugin)

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(ext1.called).to.be.equals(true)
      hemera.close(done)
    })
  })
})
