'use strict'

const Hemera = require('../../packages/hemera')
const Code = require('code')
const Sinon = require('sinon')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0)

describe('Hemera', function () {
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

  it('Should be able to add a handler and act it', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, (resp, cb) => {
        cb(null, {
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

  it('Should be able to add a handler and act it with complex types', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a.number + resp.b.number
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a.number * resp.b.number
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: { number: 1 },
        b: { number: 2 }
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: { number: resp.result },
          b: { number: 2 }
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(6)

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should be able to act without a callback', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
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
      })

      hemera.close()
      done()
    })
  })

  it('Should be able to define server method with chaining syntax', function (done) {
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

  it('Should be able to define middleware for a server method with chaining syntax', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          callback()
          next()
        })
        .use(function (req, resp, next) {
          callback()
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
        expect(callback.calledTwice).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to pass an array of middleware function for a server method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use([function (req, resp, next) {
          callback()
          next()
        }, function (req, resp, next) {
          callback()
          next()
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
        expect(resp).to.be.equals(3)
        expect(callback.calledTwice).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to get list of all patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'send'
      }, (resp, cb) => {

      })

      let result = hemera.list()

      expect(result).to.be.an.array()

      hemera.close()
      done()
    })
  })

  it('Topic is required in a add', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add({
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to subscribe')
        hemera.close()
        done()
      }
    })
  })

  it('Should throw an error by duplicate patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb()
        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Pattern is already in use')
        hemera.close()
        done()
      }
    })
  })

  it('Should be able to handle an middleware error of a server method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next(new Error('test'))
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
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Middleware error')
        hemera.close()
        done()
      })
    })
  })

  it('A middleware error should abort the response with the error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    let callback = Sinon.spy()

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
        .use(function (req, resp, next) {
          next(new Error('test'))
        })
        .use(function (req, resp, next) {
          callback()
          next()
        })
        .end(function (req, cb) {
          callback()
          cb(null, req.a + req.b)
        })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Middleware error')
        expect(callback.calledOnce).to.be.equals(false)
        hemera.close()
        done()
      })
    })
  })

  it('Topic is required in a act', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.act({
          cmd: 'send'
        }, (resp, cb) => {

        })
      } catch (err) {
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('No topic to request')
        hemera.close()
        done()
      }
    })
  })

  it('Should be able to call a handler by different patterns', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a - resp.b
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
          cmd: 'sub',
          a: 2,
          b: 2
        }, (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp.result).to.be.equals(0)
          hemera.close()
          done()
        })
      })
    })
  })

  it('Should call server function only one time (queue groups by default)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera1 = new Hemera(nats)

    let callback = Sinon.spy()

    hemera1.ready(() => {
      hemera1.add({
        topic: 'email',
        cmd: 'send'
      }, (req, cb) => {
        cb()
        callback()
      })
    })

    const hemera2 = new Hemera(nats)

    hemera2.ready(() => {
      hemera2.add({
        topic: 'email',
        cmd: 'send'
      }, (req, cb) => {
        cb()
        callback()
      })

      setTimeout(function () {
        hemera2.act({
          topic: 'email',
          cmd: 'send',
          email: 'foobar@gmail.com',
          msg: 'Hi!'
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(callback.calledOnce).to.be.equals(true)
          hemera1.close()
          hemera2.close()
          done()
        })
      }, 50)
    })
  })
})

describe('Quick syntax for JSON objects', function () {
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

  it('Should be able to use a string as pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add('topic:math,cmd:add', (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act('topic:math,cmd:add,a:1,b:2', (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)

        hemera.close()
        done()
      })
    })
  })
})

describe('public interface', function () {
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

  it('public getter', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    expect(hemera.transport).to.be.exists()
    expect(hemera.topics).to.be.exists()
    expect(hemera.router).to.be.exists()

    hemera.close()
    done()
  })

  it('public set options', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    expect(hemera.setOption).to.be.exists()
    expect(hemera.setConfig).to.be.exists()

    hemera.close()
    done()
  })
})

describe('Timeouts', function () {
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

  it('Issue #39 - Should get the correct results even when the answers are responded after a timeout', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let aError = 0
    let bError = 0
    let aResult = 0
    let bResult = 0

    hemera.ready(() => {
      hemera.add({
        topic: 'test',
        cmd: 'A'
      }, (resp, cb) => {
        setTimeout(() => {
          cb(null, {
            ok: true
          })
        }, 250)
      })

      hemera.add({
        topic: 'test',
        cmd: 'B'
      }, function (resp, cb) {
        this.act({
          topic: 'test',
          cmd: 'A',
          timeout$: 100
        }, function (err, res) {
          if (err) {
            aError++
            cb(err)
          } else {
            aResult++
            cb(null, res)
          }
        })
      })

      hemera.act({
        topic: 'test',
        cmd: 'B',
        timeout$: 150
      }, function (err, resp) {
        if (err) {
          bError++
        } else {
          bResult++
        }
      })

      setTimeout(() => {
        expect(aError).to.be.equals(1)
        expect(aResult).to.be.equals(1)
        expect(bError).to.be.equals(1)
        expect(bResult).to.be.equals(1)
        hemera.close()
        done()
      }, 300)
    })
  })
})

describe('Timeouts', function () {
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

  it('Should throw timeout error when callback is not fired', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        setTimeout(() => {
          expect(err).to.be.exists()
          expect(resp).not.to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          expect(err.message).to.be.equals('Timeout')
          hemera.close()
          done()
        }, 200)
      })
    })
  })

  it('Should be able listen on client timeout events in onClientPostRequest', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 150
    })

    let event = Sinon.spy()

    hemera.ready(() => {
      hemera.on('clientPostRequest', function () {
        const ctx = this
        const err = ctx._response.error

        expect(err).to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')

        event()
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(event.called).to.be.equals(true)
        expect(resp).not.to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')
        hemera.close()
        done()
      })
    })
  })

  it('Should throw timeout error when pattern is not defined on the network', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(resp).not.to.be.exists()
        expect(err.name).to.be.equals('TimeoutError')
        expect(err.message).to.be.equals('Timeout')
        hemera.close()
        done()
      })
    })
  })
})

describe('Publish / Subscribe', function () {
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

  it('Should be able to publish one message to one subscriber (1 to 1 without reply)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        hemera.close()
        done()
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })
    })
  })

  it('Should be able to use normal publish/subscribe behaviour (1 to many)', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera1 = new Hemera(nats)

    let counter = 0

    function called () {
      counter++

      if (counter === 2) {
        hemera1.close()
        hemera2.close()
        done()
      }
    }

    hemera1.ready(() => {
      hemera1.add({
        pubsub$: true,
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        called()
      })
    })

    const hemera2 = new Hemera(nats)

    hemera2.ready(() => {
      hemera2.add({
        pubsub$: true,
        topic: 'email',
        cmd: 'send'
      }, (resp) => {
        called()
      })

      hemera2.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })
    })
  })

  it('Should crash on unhandled business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      setTimeout(() => {
        expect(stub.called).to.be.equals(true)

        hemera.close()
        done()
      }, 100)
    })
  })

  it('Should not crash on unhandled business errors when crashOnFatal is set to false', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        pubsub$: true,
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      })

      setTimeout(() => {
        expect(stub.called).to.be.equals(false)

        hemera.close()
        done()
      }, 100)
    })
  })
})

describe('Exposing', function () {
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

  it('Should be able to expose some propertys', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.expose('test', 1)

      expect(hemera.exposition.core.test).to.be.equals(1)

      hemera.close()
      done()
    })
  })
})

describe('Error handling', function () {
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

  it('Should be able to serialize and deserialize an error back to the callee', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(new Error('Uups'))
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Uups')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle parsing errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    var stub = Sinon.stub(hemera._decoder, 'decode')

    stub.returns({
      error: new Error('TEST')
    })

    hemera.ready(() => {
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
        expect(err.name).to.be.equals('HemeraParseError')
        expect(err.message).to.be.equals('Invalid payload')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('TEST')

        stub.restore()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle response parsing error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      var stub = Sinon.stub(hemera._decoder, 'decode')

      stub.onCall(1)

      stub.returns({
        error: new Error('TEST')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraParseError')
        expect(err.message).to.be.equals('Invalid payload')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('TEST')

        stub.restore()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('ImplementationError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Shit!')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should crash on fatal', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: true,
      timeout: 10000
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 20)
      })
    })
  })

  it('Should crash when an unexpected error thrown during timeout issue', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      timeout: 20
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 500)

        throw (new Error('Test'))
      })
    })
  })

  it('Should crash on unhandled business errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        throw new Error('Shit!')
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('ImplementationError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('Shit!')
        expect(err.ownStack).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Pattern not found', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'email',
        test: 'senddedede'
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('PatternNotFound')
        expect(err.message).to.be.equals('No handler found for this pattern')
        hemera.close()
        done()
      })
    })
  })

  it('Should crash when an expected error happens in the ACT handler', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: true,
      timeout: 10000
    })

    var stub = Sinon.stub(hemera, 'fatal')

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {
      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(true)
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.exists()
        // Fatal Error will be throw after the server proceed the msg
        setTimeout(() => {
          expect(stub.called).to.be.equals(true)
          stub.restore()
          hemera.close()
          done()
        }, 50)

        throw (new Error('Test'))
      })
    })
  })

  it('Error propagation', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        cb(new Error('B Error'))
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        // In a chain of nested wrapped errors, the original unwrapped cause can be accessed through the rootCause property of each SuperError instance in the chain.
        expect(err.rootCause.name).to.be.equals('Error')
        expect(err.rootCause.message).to.be.equals('B Error')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Bad implementation')

        expect(err.cause.name).to.be.equals('BusinessError')
        expect(err.cause.message).to.be.equals('Bad implementation')

        expect(err.cause.cause.name).to.be.equals('BusinessError')
        expect(err.cause.cause.message).to.be.equals('Bad implementation')

        expect(err.cause.cause.cause.name).to.be.equals('Error')
        expect(err.cause.cause.cause.message).to.be.equals('B Error')

        hemera.close()
        done()
      })
    })
  })
})

describe('Plugin interface', function () {
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

  it('Should be able to use a plugin', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.expose('test', 1)

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    let pluginOptions = {
      a: '1'
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(hemera.exposition.myPlugin.test).to.be.equals(1)

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).not.to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to get a map of registered plugins', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin1 = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin1,
      attributes: {
        name: 'myPlugin1'
      },
      options: pluginOptions
    })

    // Plugin
    let plugin2 = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add2'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin2,
      attributes: {
        name: 'myPlugin2'
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(JSON.parse(JSON.stringify(hemera.plugins))).to.include({
        core: {
          name: 'core'
        },
        myPlugin1: {
          attributes: {
            name: 'myPlugin1',
            dependencies: []
          },
          parentPlugin: 'core',
          options: {
            a: '1',
            payloadValidator: ''
          }
        },
        myPlugin2: {
          attributes: {
            name: 'myPlugin2',
            dependencies: []
          },
          parentPlugin: 'core',
          options: {
            a: '1',
            payloadValidator: ''
          }
        }
      })

      hemera.close()
      done()
    })
  })

  it('Should be able to register the plugin twice when multiple attribute is set to true', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2'
        },
        options: pluginOptions
      })
    }

    // Plugin
    let plugin2 = function (options) {}

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: pluginOptions
      })
      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2',
          multiple: true
        },
        options: pluginOptions
      })
      hemera.close()
      done()
    } catch (err) {
      expect(err).to.be.not.exists()
    }
  })

  it('Should thrown an error when the plugin is registered twice when multiple attribute is not set to true', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2'
        },
        options: pluginOptions
      })
    }

    // Plugin
    let plugin2 = function (options) {}

    try {
      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: pluginOptions
      })
      hemera.use({
        plugin: plugin2,
        attributes: {
          name: 'myPlugin2',
          multiple: false
        },
        options: pluginOptions
      })
      hemera.close()
      done()
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Plugin was already registered')
      hemera.close()
      done()
    }
  })

  it('Plugin name is required', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    try {
      hemera.use({
        plugin: plugin,
        attributes: {},
        options: pluginOptions
      })
    } catch (err) {
      expect(err).to.exists()
      expect(err.name).to.be.equals('HemeraError')
      expect(err.message).to.be.equals('Plugin name is required')
      hemera.close()
      done()
    }
  })

  it('Should be able to specify plugin options as second argument in use method', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      expect(options.a).to.be.equals('1')

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'foo',
        description: 'test',
        version: '1.0.0'
      }
    }, pluginOptions)

    hemera.ready(() => {
      expect(hemera.plugins.foo.options.a).to.be.equals('1')
      hemera.close()
      done()
    })
  })

  it('Should be able to specify plugin attributes by package.json', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let pluginOptions = {
      a: '1'
    }

    // Plugin
    let plugin = function (options) {
      let hemera = this

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })
    }

    const packageJson = {
      name: 'foo',
      description: 'test',
      version: '1.0.0'
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        pkg: packageJson,
        dependencies: ['bar']
      },
      options: pluginOptions
    })

    hemera.ready(() => {
      expect(hemera.plugins.foo.attributes.name).to.be.equals('foo')
      expect(hemera.plugins.foo.attributes.description).to.be.equals('test')
      expect(hemera.plugins.foo.attributes.version).to.be.equals('1.0.0')
      expect(hemera.plugins.foo.attributes.dependencies).to.be.equals(['bar'])
      expect(hemera.plugins.foo.options).to.be.equals(pluginOptions)
      hemera.close()
      done()
    })
  })
})

describe('Logging interface', function () {
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

  it('Should be able to use custom logger', function (done) {
    const nats = require('nats').connect(authUrl)

    let logger = {
      info: function () {},
      fatal: function () {}
    }

    var logSpy = Sinon.spy(logger, 'info')

    const hemera = new Hemera(nats, {
      logger
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).not.to.be.equals(3)
        expect(logSpy.called).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })
})

describe('Metadata', function () {
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

  it('Should be able to pass metadata', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        cb(null, {
          result: resp.a - resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        expect(this.meta$.a).to.be.equals('test')

        this.act({
          topic: 'math',
          cmd: 'sub',
          a: 1,
          b: 2,
          meta$: {
            b: 33
          }
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(this.meta$.a).to.be.equals('test')
          expect(this.meta$.b).to.be.equals(33)

          cb(null, {
            result: resp.a + resp.b
          })
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        meta$: {
          a: 'test'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()

        this.act({
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
  })
})

describe('Load', function () {
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

  it('Should return informations about the current load of the running process', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      load: {
        sampleInterval: 1
      }
    })

    hemera.ready(() => {
      const load = hemera.load

      expect(load.eventLoopDelay).to.be.number()
      expect(load.heapUsed).to.be.number()
      expect(load.rss).to.be.number()

      hemera.close()
      done()
    })
  })
})

describe('Context', function () {
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

  it('Should be able to create a context', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb(null, {
          result: resp.a + resp.b
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        context$: 'test'
      }, function (err, resp) {
        expect(this.context$).to.be.equals('test')
        expect(err).to.be.not.exists()
        expect(resp).not.to.be.equals(3)

        this.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, function (err, resp) {
          expect(this.context$).to.be.equals('test')
          expect(err).to.be.not.exists()
          expect(resp).not.to.be.equals(3)
          hemera.close()
          done()
        })
      })
    })
  })
})

describe('Delegate', function () {
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

  it('Should be able to pass data only to the next', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        cb()
      })

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        expect(this.delegate$.name).to.exist()

        hemera.act({
          topic: 'math',
          cmd: 'sub',
          a: 1,
          b: 2
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(this.delegate$.name).to.not.exist()
          cb()
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        delegate$: {
          name: 'test'
        }
      }, function (err, resp) {
        expect(this.delegate$.name).to.exist()
        expect(err).to.be.not.exists()

        hemera.close()
        done()
      })
    })
  })
})

describe('Tracing', function () {
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

  it('Should set correct request parentId$, span and request$ context', function (done) {
    /**
     * math:add-->math:sub
     *            math:add
     *            math:add-->
     *
     */

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      expect(this.parentId$).to.be.not.exists()

      let traceId = '' // Is unique in a request

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        expect(this.trace$.traceId).to.be.string()
        expect(this.trace$.spanId).to.be.string()

        cb(null, resp.a + resp.b)
      })

      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        let r1 = this.request$.id

        expect(this.trace$.traceId).to.be.string()
        expect(this.trace$.spanId).to.be.string()
        expect(this.request$.parentId).to.be.exists()
        expect(this.trace$.parentSpanId).to.be.string()

        this.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        })

        setTimeout(() => {
          this.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          }, function (err, resp2) {
            let r2 = this.request$.id

            expect(err).to.be.not.exists()
            expect(this.request$.parentId).to.be.equals(r1)

            expect(this.trace$.traceId).to.be.equals(traceId)
            expect(this.trace$.spanId).to.be.string()
            expect(this.request$.duration).to.be.a.number()

            this.act({
              topic: 'math',
              cmd: 'add',
              a: 10,
              b: 2
            }, function (err, resp2) {
              expect(err).to.be.not.exists()
              expect(this.request$.parentId).to.be.equals(r2)
              expect(this.trace$.parentSpanId).to.be.string()
              expect(this.trace$.traceId).to.be.equals(traceId)
              expect(this.trace$.spanId).to.be.string()
              expect(this.request$.duration).to.be.a.number()

              cb(null, resp.a - resp.b)
            })
          })
        }, 200)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function (err, resp) {
        let r1 = this.request$.id
        expect(err).to.be.not.exists()
        expect(this.trace$.traceId).to.be.exists()
        expect(this.trace$.spanId).to.be.string()
        expect(this.request$.id).to.be.string()
        expect(this.request$.duration).to.be.a.number()

        traceId = this.trace$.traceId

        this.act({
          topic: 'math',
          cmd: 'sub',
          a: 1,
          b: resp
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(this.request$.parentId).to.be.equals(r1)

          expect(this.trace$.traceId).to.be.equals(traceId)
          expect(this.trace$.spanId).to.be.string()
          expect(this.trace$.parentSpanId).to.be.string()
          expect(this.request$.id).to.be.string()
          expect(this.request$.parentId).to.be.a.string()
          expect(this.request$.duration).to.be.a.number()

          hemera.close()
          done()
        })
      })
    })
  })

  it('Should get correct tracing informations', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverPreRequest', function () {
        const ctx = this
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        let traceData = {
          traceId: ctx.trace$.traceId,
          parentSpanId: ctx.trace$.parentSpanId,
          spanId: ctx.trace$.spanId,
          sampled: 1
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')

        expect(traceData.traceId).to.be.exist()
        expect(traceData.parentSpanId).to.be.not.exist()
        expect(traceData.spanId).to.be.exist()
        expect(traceData.sampled).to.be.exist()
      })

      hemera.on('serverPreResponse', function () {
        const ctx = this
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')
      })

      hemera.on('clientPreRequest', function () {
        const ctx = this
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        let traceData = {
          traceId: ctx.trace$.traceId,
          parentSpanId: ctx.trace$.parentSpanId,
          spanId: ctx.trace$.spanId,
          sampled: 1
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')

        expect(traceData.traceId).to.be.exist()
        expect(traceData.parentSpanId).to.be.not.exist()
        expect(traceData.spanId).to.be.exist()
        expect(traceData.sampled).to.be.exist()
      })

      hemera.on('clientPostRequest', function () {
        const ctx = this
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        cmd: 'add',
        topic: 'math',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        hemera.close()
        done()
      })
    })
  })
})

describe('Extension error', function () {
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

  it('Invalid extension type', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      try {
        hemera.ext('test', function (next) {})
      } catch (e) {
        expect(e.name).to.be.equals('HemeraError')
        expect(e.message).to.be.equals('Invalid extension type')
        hemera.close()
        done()
      }
    })
  })

  it('onClientPostRequest', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options) {
      let hemera = this

      hemera.ext('onClientPostRequest', function (next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: {}
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })

  it('onClientPreRequest', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options) {
      let hemera = this

      hemera.ext('onClientPreRequest', function (next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: {}
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })

  it('onServerPreRequest', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options) {
      let hemera = this

      hemera.ext('onServerPreRequest', function (req, res, next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: {}
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })

  it('onServerPreResponse', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let plugin = function (options) {
      let hemera = this

      hemera.ext('onServerPreResponse', function (req, res, next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })
    }

    hemera.use({
      plugin: plugin,
      attributes: {
        name: 'myPlugin'
      },
      options: {}
    })

    hemera.ready(() => {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })
    })
  })
})

describe('Extension reply', function () {
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

  it('Should be bale to reply an error', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext1()
        res.send(new Error('test'))
      })

      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
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
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(false)
        expect(err).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('end', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext1()
        res.end({
          msg: 'unauthorized'
        })
      })

      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
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
        expect(resp).to.be.equals({
          msg: 'unauthorized'
        })
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(false)
        expect(err).to.be.not.exists()
        hemera.close()
        done()
      })
    })
  })

  it('send and passing value to the next extension point', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()
    let ext3 = Sinon.spy()
    let ext4 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext1()
        res.send({
          msg: 'a'
        })
      })

      hemera.ext('onServerPreHandler', function (req, res, next, prevValue) {
        ext2()
        res.send({
          msg: 'b' + prevValue.msg
        })
      })

      hemera.ext('onServerPreHandler', function (req, res, next, prevValue) {
        ext3()
        res.send({
          msg: 'c' + prevValue.msg
        })
      })

      hemera.ext('onServerPreHandler', function (req, res, next, prevValue) {
        ext4()

        expect(prevValue).to.be.equals({
          msg: 'cba'
        })

        res.end({
          msg: 'authorized'
        })
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
        expect(resp).to.be.equals({
          msg: 'authorized'
        })
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(true)
        expect(ext3.called).to.be.equals(true)
        expect(ext4.called).to.be.equals(true)
        expect(err).to.be.not.exists()
        hemera.close()
        done()
      })
    })
  })

  it('send', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext1()
        res.send({
          msg: 'unauthorized'
        })
      })

      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext2()

        res.end({
          msg: 'authorized'
        })
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
        expect(resp).to.be.equals({
          msg: 'authorized'
        })
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(true)
        expect(err).to.be.not.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to access request and response in server extensions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()
    let ext3 = Sinon.spy()

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.undefined()
        ext1()
        next()
      })

      hemera.ext('onServerPreRequest', function (req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.undefined()
        ext2()
        next()
      })

      hemera.ext('onServerPreResponse', function (req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.object()
        ext3()
        next()
      })

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {
        cb(null, {
          foo: 'bar'
        })
      })

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(true)
        expect(ext3.called).to.be.equals(true)
        hemera.close()
        done()
      })
    })
  })

  it('Should pass the response to the next', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext1()
        next()
      })

      hemera.ext('onServerPreHandler', function (req, res, next) {
        ext2()
        res.send({
          msg: 'authorized'
        })
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
        expect(resp).to.be.equals({
          msg: 'authorized'
        })
        expect(ext1.called).to.be.equals(true)
        expect(ext2.called).to.be.equals(true)
        expect(err).to.be.not.exists()
        hemera.close()
        done()
      })
    })
  })
})

describe('Response error events', function () {
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

  it('server response extension error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.ext('onServerPreResponse', function (resp, req, next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })

  it('server response error result', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Bad implementation')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(new Error('test'))
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })

  it('client response error result', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {
      hemera.on('clientResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('FatalError')
        expect(err.message).to.be.equals('Fatal error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb()
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function () {
        throw new Error('test')
      })
    })
  })

  it('client response extension error', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('clientResponseError', function (err) {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Extension error')
        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('test')
        hemera.close()
        done()
      })

      hemera.ext('onClientPostRequest', function (next) {
        next(new Error('test'))
      })

      hemera.add({
        cmd: 'add',
        topic: 'math'
      }, (resp, cb) => {
        cb(null, resp.a + resp.b)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      })
    })
  })
})

describe('Default JSON encoder', function () {
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

  it('Should be able to handle circular references', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'circular',
        cmd: 'test'
      }, (resp, cb) => {
        const fixture = {
          name: 'Tywin Lannister',
          child: {
            name: 'Tyrion Lannister'
          }
        }
        fixture.child.dinklage = fixture.child
        cb(null, fixture)
      })

      hemera.act({
        topic: 'circular',
        cmd: 'test'
      }, function (err, res) {
        expect(err).to.be.not.exists()
        expect(res).to.be.equals({
          name: 'Tywin Lannister',
          child: {
            name: 'Tyrion Lannister',
            dinklage: '[Circular]'
          }
        })
        hemera.close()
        done()
      })
    })
  })
})
