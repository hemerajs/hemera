'use strict'

describe('Hemera', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should throw error when hemera is bootstraped twice', function(done) {
    const nats = require('nats').connect(authUrl)
    const hemera = new Hemera(nats)
    hemera.ready(() => {
      try {
        hemera.ready()
      } catch (err) {
        expect(err.message).to.be.equals('Hemera was already bootstraped')
        done()
      }
    })
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
          expect(err).to.be.not.exists()
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

  it('IdGenerator must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setIdGenerator(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('IdGenerator must be a function')
        hemera.close(done)
      }
    })
  })

  it('ServerDecoder must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setServerDecoder(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('ServerDecoder must be a function')
        hemera.close(done)
      }
    })
  })

  it('ServerEncoder must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setServerEncoder(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('ServerEncoder must be a function')
        hemera.close(done)
      }
    })
  })

  it('ClientDecoder must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setClientDecoder(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('ClientDecoder must be a function')
        hemera.close(done)
      }
    })
  })

  it('ClientEncoder must be from type function', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.setClientEncoder(null)
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('ClientEncoder must be a function')
        hemera.close(done)
      }
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
        expect(err.message).to.be.equals(
          'Pattern is required to define a server action'
        )
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
        expect(err.message).to.be.equals(
          'Topic is required and must be from type string'
        )
        hemera.close(done)
      }
    })
  })

  it('Should throw an error by duplicated patterns', function(done) {
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

  it('Should be able to access request, response context inside act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'send'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'send',
          maxMessages$: 1,
          expectedMessages$: 1
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(this.request).to.be.object()
          expect(this.request.pattern).to.be.equals({
            topic: 'math',
            cmd: 'send',
            maxMessages$: 1,
            expectedMessages$: 1
          })
          expect(this.request.transport.maxMessages).to.be.equals(1)
          expect(this.request.transport.pubsub).to.be.undefined()
          expect(this.request.transport.topic).to.be.equals('math')
          expect(this.request.transport.expectedMessages).to.be.equals(1)

          expect(this.response).to.be.object()
          expect(this.response.payload).to.be.object()
          expect(this.response.error).to.be.null()
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to access request, response, matchedAction context inside add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'send',
          schema: { foo: 'bar' },
          maxMessages$: 1
        },
        function(resp, cb) {
          expect(this.matchedAction).to.be.an.object()
          expect(this.matchedAction.transport.pubsub).to.be.undefined()
          expect(this.matchedAction.transport.maxMessages).to.be.equals(1)
          expect(this.matchedAction.transport.queue).to.be.undefined()
          expect(this.matchedAction.transport.topic).to.be.equals('math')
          expect(this.matchedAction.sid).to.be.number()
          expect(this.matchedAction.action).to.be.function()
          expect(this.matchedAction.pattern).to.be.equals({
            topic: 'math',
            cmd: 'send'
          })
          expect(this.matchedAction.schema).to.be.equals({
            schema: { foo: 'bar' }
          })

          expect(this.response.payload).to.be.undefined()
          expect(this.response.error).to.be.null()
          expect(this.response.replyTo).to.be.string()

          expect(this.request).to.be.object()
          expect(this.request.payload).to.be.object()
          expect(this.request.error).to.be.null()

          cb()
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'send'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Topic must be set in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.act(null, resp => {})
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals(
          'Pattern is required to start a request'
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
          resp => {}
        )
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals(
          'Topic is required and must be from type string'
        )
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

  it('Should be able to set a different id generator', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.setIdGenerator(() => 100)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'email',
          cmd: 'send'
        },
        function(resp, cb) {
          expect(this.trace$.spanId).to.be.equals(100)
          expect(this.trace$.traceId).to.be.equals(100)
          expect(this.request$.id).to.be.equals(100)
          cb()
        }
      )

      hemera.act(
        {
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        },
        function() {
          expect(this.trace$.spanId).to.be.equals(100)
          expect(this.trace$.traceId).to.be.equals(100)
          expect(this.request$.id).to.be.equals(100)
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

  it('Should return Add Object instance with all informations', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      const add = hemera.add(
        {
          topic: 'math',
          cmd: 'info',
          queue$: 'test',
          maxMessages$: 1,
          payload: {
            a: 1
          }
        },
        (req, cb) => {
          cb(null, true)
        }
      )
      expect(add.sid).to.be.number()
      expect(add.middleware).to.be.equals([])
      expect(add.transport.maxMessages).to.be.equals(1)
      expect(add.transport.topic).to.be.equals('math')
      expect(add.transport.queue).to.be.equals('test')
      expect(add.action).to.be.function()
      expect(add.pattern).to.be.equals({
        topic: 'math',
        cmd: 'info'
      })
      expect(add.schema).to.be.equals({
        payload: {
          a: 1
        }
      })
      hemera.close(done)
    })
  })
})
