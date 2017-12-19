'use strict'

describe('Hemera', function() {
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

  it('Should be able to add a handler and act it', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
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

      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a * resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(3)

          hemera.act(
            {
              topic: 'math',
              cmd: 'multiply',
              a: resp.result,
              b: 2
            },
            (err, resp) => {
              expect(err).not.to.be.exists()
              expect(resp.result).to.be.equals(6)

              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should be able to add a handler and act it with complex types', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a.number + resp.b.number
          })
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a.number * resp.b.number
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: {
            number: 1
          },
          b: {
            number: 2
          }
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(3)

          hemera.act(
            {
              topic: 'math',
              cmd: 'multiply',
              a: {
                number: resp.result
              },
              b: {
                number: 2
              }
            },
            (err, resp) => {
              expect(err).not.to.be.exists()
              expect(resp.result).to.be.equals(6)

              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should be able to define a pattern with regex', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        indexing: 'depth'
      }
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          id: /.*/
        },
        (resp, cb) => {
          cb(null, 'id')
        }
      )

      hemera.add(
        {
          topic: 'email',
          cmd: 'send',
          name: /.*/
        },
        (resp, cb) => {
          cb(null, 'name')
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          id: 1
        },
        (err, req) => {
          expect(req).to.be.equals('id')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to act without a callback', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      hemera.close(done)
    })
  })

  it('Should be able to support zero as a server response', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        (req, cb) => {
          cb(null, req.a * req.b)
        }
      )
      hemera.act(
        {
          topic: 'math',
          cmd: 'multiply',
          a: 0,
          b: 0
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(0)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to set specific config', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      let result = hemera.setConfig('a', 1)

      expect(hemera.config.a).to.be.equals(1)

      hemera.close(done)
    })
  })

  it('Should be able to access root instance', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      let result = hemera.root()

      expect(result instanceof Hemera).to.be.equals(true)

      hemera.close(done)
    })
  })

  it('Should be able to get list of all patterns', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'send'
        },
        (resp, cb) => {}
      )

      let result = hemera.list()

      expect(result).to.be.an.array()

      hemera.close(done)
    })
  })

  it('Pattern is required to define an add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(null, (resp, cb) => {
          cb()
        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Pattern is required to define an add')
        hemera.close(done)
      }
    })
  })

  it('Topic is required in a add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add(
          {
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to subscribe')
        hemera.close(done)
      }
    })
  })

  it('Should throw an error by duplicate patterns', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: true
      }
    })

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
            cmd: 'send'
          },
          (resp, cb) => {
            cb()
          }
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Pattern is already in use')
        hemera.close(done)
      }
    })
  })

  it('Topic must be set in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.act(null, (resp, cb) => {})
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals(
          'Pattern is required to start an act call'
        )
        hemera.close(done)
      }
    })
  })

  it('Topic is required in a act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.act(
          {
            cmd: 'send'
          },
          (resp, cb) => {}
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to request')
        hemera.close(done)
      }
    })
  })

  it('Should be able to call a handler by different patterns', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
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

      hemera.add(
        {
          topic: 'math',
          cmd: 'sub'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a - resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(3)

          hemera.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: 2,
              b: 2
            },
            (err, resp) => {
              expect(err).not.to.be.exists()
              expect(resp.result).to.be.equals(0)
              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should call server function only one time (queue groups by default)', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera1 = new Hemera(nats)

    let callback = Sinon.spy()

    hemera1.ready(() => {
      hemera1.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (req, cb) => {
          cb()
          callback()
        }
      )
    })

    const hemera2 = new Hemera(nats)

    hemera2.ready(() => {
      hemera2.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        (req, cb) => {
          cb()
          callback()
        }
      )

      setTimeout(function() {
        hemera2.act(
          {
            topic: 'email',
            cmd: 'send',
            email: 'foobar@gmail.com',
            msg: 'Hi!'
          },
          function(err, resp) {
            expect(err).to.be.not.exists()
            expect(callback.calledOnce).to.be.equals(true)
            hemera1.close(x => hemera2.close(done))
          }
        )
      }, 50)
    })
  })

  it('Should be able to use token wildcard in topic declaration', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'systems-europe.a.>',
          cmd: 'info'
        },
        (req, cb) => {
          cb(null, true)
        }
      )
      hemera.act(
        {
          topic: 'systems-europe.a.info.details',
          cmd: 'info'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to use full wildcard in topic declaration', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'systems-europe.a.*',
          cmd: 'info'
        },
        (req, cb) => {
          cb(null, true)
        }
      )
      hemera.act(
        {
          topic: 'systems-europe.a.info',
          cmd: 'info'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })
})
