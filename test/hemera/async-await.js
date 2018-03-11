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

  it('Should be able to await in add middleware', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

    const resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data).to.be.equals(3)
    return hemera.close()
  })

  it('Should be able to reply in middleware', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

    const resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data.a).to.be.equals(1)
    return hemera.close()
  })

  it('Should be able to reply an error in middleware', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

    return hemera
      .act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
      .catch(err => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        return hemera.close()
      })
  })

  it('Should be able to await in end function of the middleware', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

    hemera
      .add({
        topic: 'math',
        cmd: 'add'
      })
      .end(async function(req) {
        const a = await Promise.resolve(req.a + req.b)
        return a
      })

    const resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data).to.be.equals(3)
    return hemera.close()
  })

  it('Should call add handler only once', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    await hemera.ready()

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

    const resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data.result).to.be.equals(3)
    expect(spy.calledOnce).to.be.equals(true)
    return hemera.close()
  })

  it('Should be able to await in add', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

    let resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data.result).to.be.equals(3)

    resp = await hemera.act({
      topic: 'math',
      cmd: 'multiply',
      a: resp.data.result,
      b: 2
    })

    expect(resp.data.result).to.be.equals(6)
    return hemera.close()
  })

  it('Should be able to await an act', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

        expect(mult.data).to.be.equals({
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

    let resp = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(resp.data.result).to.be.equals(3)
    return hemera.close()
  })

  it('Should be able to await an act in pubsub mode', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

    hemera.add(
      {
        pubsub$: true,
        topic: 'math',
        cmd: 'add'
      },
      function(resp) {}
    )

    const result = await hemera.act({
      pubsub$: true,
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(result.data).to.be.not.exists()
    expect(result.context).to.be.exists()

    return hemera.close()
  })

  it('Should be able to await inside ready callback', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    await hemera.ready()

    hemera.add(
      {
        pubsub$: true,
        topic: 'math',
        cmd: 'add'
      },
      function(resp) {
        spy()
      }
    )

    await hemera.act({
      pubsub$: true,
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    })

    expect(spy.calledOnce).to.be.true()

    return hemera.close()
  })

  it('Should be able to propagate errors in add', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      async function(resp) {
        await Promise.reject(new Error('test'))
      }
    )

    return hemera
      .act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
      .catch(err => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        return hemera.close()
      })
  })

  it('Should be able to chain an act', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

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

    return hemera
      .act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
      .then(function(out) {
        expect(out.data).to.be.equals({
          result: true
        })
        return hemera.close()
      })
  })

  it('Should be able to catch an error in act', async function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    await hemera.ready()

    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      async function(resp) {
        await Promise.reject(new Error('test'))
      }
    )

    try {
      await hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    } catch (err) {
      expect(err).to.be.exists()
      hemera.close()
    }
  })
})
