'use strict'

describe('Transport options', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should not be able to register pubsub and request mode with the same topic / 1', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            pubsub$: true
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.pubsub).to.be.equals(true)
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should not be able to register pubsub and request mode with the same topic / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            pubsub$: true
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.pubsub).to.be.undefined()
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should not be able to register custom queue and default queue with the same topic / 1', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            queue$: 'test'
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.queue).to.be.equals('test')
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should not be able to register custom queue and default queue with the same topic / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            queue$: 'test'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.queue).to.be.undefined()
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should not be able to register custom maxMessages and default with the same topic / 1', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            maxMessages$: 10
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.maxMessages).to.be.equals(10)
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should not be able to register custom maxMessages and default with the same topic / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            topic: 'math',
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )

        hemera.add(
          {
            topic: 'math',
            cmd: 'send',
            maxMessages$: 10
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(hemera.list().length).to.be.equals(1)
        expect(hemera.list()[0].transport.maxMessages).to.be.undefined()
        expect(hemera.list()[0].pattern).to.be.equals({
          topic: 'math',
          cmd: 'send'
        })
        expect(err.message).to.be.equals('Topic is already registered with special transport options')
        hemera.close(done)
      }
    })
  })

  it('Should be able to register server methods with exact same transport options', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'send',
          maxMessages$: 100,
          pubsub$: true,
          queue$: 'test'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'send',
          maxMessages$: 100,
          pubsub$: true,
          queue$: 'test'
        },
        (resp, cb) => {
          cb()
        }
      )
      expect(hemera.list().length).to.be.equals(2)
      hemera.close(done)
    })
  })
})
