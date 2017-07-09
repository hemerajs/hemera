'use strict'

describe('Async / Await support', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to await in add middleware', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(async function (req, resp) {
          const a = await { a: 1 }
          req.locals.test = a
        })
        .end(function (req, cb) {
          expect(this._request.locals).to.be.equals({ test: { a: 1 } })
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to await in end function of the middleware', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .end(async function (req) {
          const a = await Promise.resolve(req.a + req.b)
          return a
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to await an error in add middleware', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(async function (req, resp) {
          const a = await Promise.reject(new Error('test'))
          return a
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to use an array of async function in add middleware', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use([async function (req, resp) {
          await Promise.resolve(true)
        }, async function (req, resp) {
          await Promise.resolve(true)
        }])
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to use a none async function in add middleware', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next()
        })
        .end(function (req, cb) {
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to await in add', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        const a = await {
          result: resp.a + resp.b
        }
        return a
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, async function (resp) {
        const a = await {
          result: resp.a * resp.b
        }
        return a
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: resp.result,
          b: 2
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(6)

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should be able to use none await function in add', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, reply) {
        reply(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, function (resp, reply) {
        reply(null, {
          result: resp.a * resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: resp.result,
          b: 2
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(6)

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should be able to await an act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
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
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, async function (resp) {
        const a = await {
          result: resp.a * resp.b
        }
        return a
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to propagate errors in add', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.reject(new Error('test'))
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.name).to.be.equals('Error')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to chain an act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.resolve({
          result: true
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, async function (err, resp) {
        expect(err).to.be.not.exists()
        return resp
      })
        .then(function (resp) {
          expect(resp).to.be.equals({
            result: true
          })
          hemera.close()
          done()
        })
    })
  })

  it('Should be able to catch an error in act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.resolve({
          result: true
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, async function (err, resp) {
        expect(err).to.be.not.exists()
        return await Promise.reject(new Error('test'))
      })
        .catch(function (err) {
          expect(err).to.be.exists()
          hemera.close()
          done()
        })
    })
  })

  it('Should throw when rejection is unhandled', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.reject(new Error('test'))
      })

      // in future we have to try catch it

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })

      setTimeout(() => {
        hemera.close()
        done()
      }, 50)
    })
  })

  it('Should be able to return result without to handle it', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.resolve({
          result: true
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })

      setTimeout(() => {
        hemera.close()
        done()
      }, 50)
    })
  })

  it('Should be able to catch an uncaught error in act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, async function (resp) {
        return await Promise.resolve({
          result: true
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, async function (err, resp) {
        expect(err).to.be.not.exists()
        throw new Error('test')
      })
        .catch(function (err) {
          expect(err).to.be.exists()
          hemera.close()
          done()
        })
    })
  })
})

describe('Async / Await support in extension', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to await in extension', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', async function (req, res) {
        return await Promise.resolve(true)
      })

      hemera.ext('onServerPreHandler', async function (req, res) {
        return await Promise.resolve('foobar')
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals('foobar')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to use none async function in extensions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        next(null, true)
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to return an error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', async function (req, res) {
        return await Promise.reject(new Error('test'))
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to catch a thrown error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', async function (req, res) {
        throw new Error('test')
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('Error')
        expect(err.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })
})
