'use strict'

describe('Streaming', function() {
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

  it('Should be able to receive lots of messages from the INBOX channel', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {
          for (let i = 0; i < 10; i++) {
            this.reply.next(i)
          }
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 10
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          results.push(resp)
          if (results.length === 10) {
            hemera.close(done)
          }
        }
      )
    })
  })

  it('Should be able to set maxMessages$ to -1 to receive unlimited count of messages', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {
          for (let i = 0; i < 10; i++) {
            this.reply.next(i)
          }
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: -1
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          results.push(resp)
          if (results.length === 10) {
            hemera.remove(this.sid)
            hemera.close(done)
          }
        }
      )
    })
  })

  it('Should be able to respond multiple errors with reply', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {
          for (let i = 0; i < 10; i++) {
            this.reply.next(new Error('test'))
          }
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 10
        },
        function(err, resp) {
          expect(err).to.be.exists()
          results.push(err)
          if (results.length === 10) {
            hemera.close(done)
          }
        }
      )
    })
  })

  it('Should respect previous set results in extension', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ext('onServerPreRequest', (hemera, request, reply, next) => {
      reply.send('a')
      next()
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {
          for (let i = 0; i < 5; i++) {
            this.reply.next(i)
          }
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 5
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          results.push(resp)
          if (results.length === 5) {
            expect(results).to.be.equals(['a', 0, 1, 2, 3])
            hemera.close(done)
          }
        }
      )
    })
  })

  it('Should respect previous set results with in middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use((req, reply, next) => {
          reply.send('a')
          next()
        })
        .end(function(resp) {
          for (let i = 0; i < 5; i++) {
            this.reply.next(i)
          }
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 5
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          results.push(resp)
          if (results.length === 5) {
            expect(results).to.be.equals(['a', 0, 1, 2, 3])
            hemera.close(done)
          }
        }
      )
    })
  })
})
