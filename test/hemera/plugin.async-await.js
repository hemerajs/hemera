'use strict'

describe('Async await Plugin interface', function() {
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

  it('Should be able to use a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    async function plugin(hemera, options) {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      return await Promise.resolve()
    }

    hemera.use(plugin)

    hemera.ready(() => {
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).not.to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to register an array of plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    async function plugin1(hemera, options) {
      return await Promise.resolve()
    }

    async function plugin2(hemera, options) {
      return await Promise.resolve()
    }

    hemera.use([plugin1, plugin2])

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(Object.keys(hemera.plugins)).to.be.equals([
        'core',
        'anonymous-2',
        'anonymous-3'
      ])
      hemera.close(done)
    })
  })
})
