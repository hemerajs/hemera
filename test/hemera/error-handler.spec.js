'use strict'

describe('Error handling', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to define a custom errorHandler in plugins', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const rootSpy = Sinon.spy()
    const pluginSpy = Sinon.spy()

    hemera.setErrorHandler((hemera, error, reply) => {
      expect(error).to.be.exists()
      rootSpy()
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.setErrorHandler((hemera, error, reply) => {
          expect(error).to.be.exists()
          pluginSpy()
        })
        hemera.add(
          {
            topic: 'math',
            cmd: 'add'
          },
          (resp, cb) => {
            cb(new Error('plugin'))
          }
        )

        done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'user',
          cmd: 'get'
        },
        (resp, cb) => {
          cb(new Error('root'))
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          expect(pluginSpy.calledOnce).to.be.equals(true)
          hemera.act(
            {
              topic: 'user',
              cmd: 'get'
            },
            (err, resp) => {
              expect(err).to.be.exists()
              expect(rootSpy.calledOnce).to.be.equals(true)
              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should not be able to define a error handler for a topic which is hosted by a plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const rootSpy = Sinon.spy()
    const pluginSpy = Sinon.spy()

    // this handler is never called because there is only one subscription per topic
    // the plugin is the owner of the topic
    hemera.setErrorHandler((hemera, error, reply) => {
      expect(error).to.be.exists()
      rootSpy()
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.setErrorHandler((hemera, error, reply) => {
          expect(error).to.be.exists()
          pluginSpy()
        })
        hemera.add(
          {
            topic: 'math',
            cmd: 'add'
          },
          (resp, cb) => {
            cb(new Error('plugin'))
          }
        )

        done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'sub'
        },
        (resp, cb) => {
          cb(new Error('root'))
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          hemera.act(
            {
              topic: 'math',
              cmd: 'sub'
            },
            (err, resp) => {
              expect(err).to.be.exists()
              expect(pluginSpy.calledTwice).to.be.equals(true)
              expect(rootSpy.called).to.be.equals(false)
              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should be possible to define a global errorHandler', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const rootSpy = Sinon.spy()

    hemera.setErrorHandler((hemera, error, reply) => {
      expect(error).to.be.exists()
      rootSpy()
    })

    // Plugin
    let myPlugin = Hp(
      function(hemera, options, done) {
        hemera.add(
          {
            topic: 'math',
            cmd: 'add'
          },
          (resp, cb) => {
            cb(new Error('plugin'))
          }
        )

        done()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    hemera.use(myPlugin)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'user',
          cmd: 'get'
        },
        (resp, cb) => {
          cb(new Error('root'))
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        (err, resp) => {
          expect(err).to.be.exists()
          hemera.act(
            {
              topic: 'user',
              cmd: 'get'
            },
            (err, resp) => {
              expect(err).to.be.exists()
              expect(rootSpy.calledTwice).to.be.equals(true)
              hemera.close(done)
            }
          )
        }
      )
    })
  })
})
