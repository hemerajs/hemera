'use strict'

describe('Async await Plugin interface', function () {
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

  it('Should be able to use a plugin', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    async function plugin(hemera, options) {
      expect(options.a).to.be.equals('1')

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

    let pluginOptions = {
      name: 'myPlugin',
      a: '1'
    }

    hemera.use({
      plugin: plugin,
      options: pluginOptions
    })

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

  it('Should able to run async await callback function', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    function plugin(hemera, options) {
      hemera.add({
        topic: 'math',
        cmd: 'add',
      }, async (req) => {
        const result = await Promise.resolve({
          result: req.a + req.b,
        });
        return result;
      });
    }

    hemera.use({
      plugin: plugin,
      options: {
        name: 'myPlugin',
      }
    })
    hemera.ready(async () => {

      try {
        const resp = await hemera.act({
          topic,
          cmd: 'add',
          a: 1,
          b: 20,
        });
        expect(resp.result).toEqual(21);
        hemera.close(done);
      } catch (err) {
        hemera.close(done.fail);
      }
    });
  })

  it('Should be able to register an array of plugins', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    async function plugin1(hemera, options) {
      return await Promise.resolve()
    }

    async function plugin2(hemera, options) {
      return await Promise.resolve()
    }

    hemera.use([
      {
        plugin: plugin1,
        options: {
          name: 'myPlugin1',
          a: 1
        }
      },
      {
        plugin: plugin2,
        options: {
          name: 'myPlugin2',
          a: 2
        }
      }
    ])

    hemera.ready(err => {
      expect(err).to.be.not.exists()
      expect(hemera.plugins.myPlugin1.plugin$.options).to.be.equals({
        name: 'myPlugin1',
        a: 1
      })
      expect(hemera.plugins.myPlugin2.plugin$.options).to.be.equals({
        name: 'myPlugin2',
        a: 2
      })
      hemera.close(done)
    })
  })
})
