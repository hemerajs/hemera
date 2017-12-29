'use strict'

describe('Async / Await support', function() {
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

  it('Should be able to await in add middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(async function(req, resp) {
          await Promise.resolve()
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reply in middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(async function(req, resp) {
          await resp.send({ a: 1 })
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.a).to.be.equals(1)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reply an error in middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .use(async function(req, resp) {
          await resp.send(new Error('test'))
        })
        .end(function(req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.message).to.be.equals('test')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to await in end function of the middleware', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera
        .add({
          topic: 'math',
          cmd: 'add'
        })
        .end(async function(req) {
          const a = await Promise.resolve(req.a + req.b)
          return a
        })

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should call add handler only once', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          spy()
          const a = await {
            result: resp.a + resp.b
          }
          return a
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
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to await in add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          const a = await {
            result: resp.a + resp.b
          }
          return a
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        async function(resp) {
          const a = await {
            result: resp.a * resp.b
          }
          return a
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

  it('Should be able to use none await function in add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp, reply) {
          reply(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        function(resp, reply) {
          reply(null, {
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

  it('Should be able to await an act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          const mult = await this.act({
            topic: 'math',
            cmd: 'multiply',
            a: 1,
            b: 2
          })

          expect(mult).to.be.equals({
            result: 2
          })

          return {
            result: resp.a + resp.b
          }
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'multiply'
        },
        async function(resp) {
          const a = await {
            result: resp.a * resp.b
          }
          return a
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to await an act in pubsub mode', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(async () => {
      hemera.add(
        {
          pubsub$: true,
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {}
      )

      hemera.act({
        pubsub$: true,
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })

      hemera.close(done)
    })
  })

  it('Should be able to pass an async function in pubsub mode', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(async () => {
      hemera.add(
        {
          pubsub$: true,
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {}
      )

      const a = await hemera.act(
        {
          pubsub$: true,
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        async () => {
          return true
        }
      )

      expect(a).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should be able to await inside ready callback', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(async () => {
      hemera.add(
        {
          pubsub$: true,
          topic: 'math',
          cmd: 'add'
        },
        function(resp) {}
      )

      await hemera.act({
        pubsub$: true,
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
      hemera.close(done)
    })
  })

  it('Should be able to propagate errors in add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          await Promise.reject(new Error('test'))
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('Error')
          expect(err.name).to.be.equals('Error')
          hemera.close(done)
        }
      )
    })
  })

  it('Should call the act handler only once per call', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          const result = await Promise.resolve({
            result: true
          })
          return result
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        async function(err, resp) {
          spy()
          expect(err).to.be.not.exists()

          setTimeout(() => {
            expect(spy.calledOnce).to.be.equals(true)
            hemera.close(done)
          }, 30)
        }
      )
    })
  })

  it('Should be able to chain an act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          const result = await Promise.resolve({
            result: true
          })
          return result
        }
      )

      hemera
        .act(
          {
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          },
          async function(err, resp) {
            expect(err).to.be.not.exists()

            return resp
          }
        )
        .then(function(resp) {
          expect(resp).to.be.equals({
            result: true
          })
          hemera.close(done)
        })
    })
  })

  it('Should be able to catch an error in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          await Promise.resolve({
            result: true
          })
        }
      )

      hemera
        .act(
          {
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          },
          async function(err, resp) {
            expect(err).to.be.not.exists()
            await Promise.reject(new Error('test'))
          }
        )
        .catch(function(err) {
          expect(err).to.be.exists()
          hemera.close(done)
        })
    })
  })

  it('Should throw when rejection is unhandled', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          await Promise.reject(new Error('test'))
        }
      )

      // in future we have to try catch it

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })

      setTimeout(() => {
        hemera.close(done)
      }, 50)
    })
  })

  it('Should be able to return result without to handle it', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          await Promise.resolve({
            result: true
          })
        }
      )

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })

      setTimeout(() => {
        hemera.close(done)
      }, 50)
    })
  })

  it('Should be able to catch an uncaught error in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        async function(resp) {
          await Promise.resolve({
            result: true
          })
        }
      )

      hemera
        .act(
          {
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          },
          async function(err, resp) {
            expect(err).to.be.not.exists()
            throw new Error('test')
          }
        )
        .catch(function(err) {
          expect(err).to.be.exists()
          hemera.close(done)
        })
    })
  })
})
