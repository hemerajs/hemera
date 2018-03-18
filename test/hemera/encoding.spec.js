'use strict'

describe('Default JSON encoder', function() {
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

  it('Should be able to handle circular references', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'circular',
          cmd: 'test'
        },
        (resp, cb) => {
          const fixture = {
            name: 'Tywin Lannister',
            child: {
              name: 'Tyrion Lannister'
            }
          }
          fixture.child.dinklage = fixture.child
          cb(null, fixture)
        }
      )

      hemera.act(
        {
          topic: 'circular',
          cmd: 'test'
        },
        function(err, res) {
          expect(err).to.be.not.exists()
          expect(res).to.be.equals({
            name: 'Tywin Lannister',
            child: {
              name: 'Tyrion Lannister',
              dinklage: '[Circular]'
            }
          })
          hemera.close(done)
        }
      )
    })
  })

  it('Should pass encoding context', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const calls = []

    hemera.setEncoder((msg, isServerEncoding) => {
      calls.push(isServerEncoding)
      return {
        value: JSON.stringify(msg)
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (req, cb) => {
          cb(null, req.a + req.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, res) {
          expect(err).to.be.not.exists()
          expect(res).to.be.equals(3)
          expect(calls).to.be.equals([false, true]) // Client -> Server
          hemera.close(done)
        }
      )
    })
  })
})
