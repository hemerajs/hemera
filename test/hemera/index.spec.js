'use strict'

const Hemera = require('../../packages/hemera'),
  Util = require('../../packages/hemera/build/util'),
  Code = require('code'),
  Sinon = require('sinon'),
  HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

process.setMaxListeners(0);

describe('Hemera', function () {

  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
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

  it('Callback must be from type function', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {

      try {

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, 'no function')

      } catch (err) {

        expect(err.name).to.be.equals('HemeraError')
        expect(err.message).to.be.equals('Missing implementation')
        hemera.close()
        done()
      }
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

    const hemera1 = new Hemera(nats, {
      crashOnFatal: false
    })

    let callback = Sinon.spy();

    hemera1.ready(() => {

      hemera1.add({
        topic: 'email',
        cmd: 'send'
      }, (req, cb) => {

        cb()
        callback()
      })

    })

    const hemera2 = new Hemera(nats, {
      crashOnFatal: false
    })

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

          expect(callback.calledOnce).to.be.equals(true)
          hemera1.close()
          hemera2.close()
          done()
        })
      }, 50)

    })
  })
})

describe('Timeouts', function () {

  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
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
      crashOnFatal: false,
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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

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

    const hemera1 = new Hemera(nats, {
      crashOnFatal: false
    })

    let counter = 0;

    function called() {
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

    const hemera2 = new Hemera(nats, {
      crashOnFatal: false
    })

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

    var stub = Sinon.stub(hemera, "fatal")

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

    var stub = Sinon.stub(hemera, "fatal")

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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

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

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    var stub = Sinon.stub(hemera._decoder, "decode")

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

        stub.restore()
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to handle response parsing error', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        cb()
      })

      var stub = Sinon.stub(hemera._decoder, "decode")

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

    var stub = Sinon.stub(hemera, "fatal")

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

        //Fatal Error will be throw after the server proceed the msg
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
      crashOnFatal: true,
      timeout: 20
    })

    var stub = Sinon.stub(hemera, "fatal")

    stub.onCall(1)

    stub.returns(true)

    hemera.ready(() => {


      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {

        //Fatal Error will be throw after the server proceed the msg
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

    const hemera = new Hemera(nats, {
      crashOnFatal: false
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
        test: 'senddedede',
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

    var stub = Sinon.stub(hemera, "fatal")

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

        //Fatal Error will be throw after the server proceed the msg
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
})

describe('Plugin interface', function () {

  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
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

    hemera.ready(() => {

      let pluginOptions = {
        a: '1'
      }

      //Plugin
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

      hemera.use({
        plugin: plugin,
        attributes: {
          name: 'myPlugin'
        },
        options: pluginOptions
      })

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

    hemera.ready(() => {

      let pluginOptions = {
        a: '1'
      }

      //Plugin
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

      //Plugin
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

      expect(hemera.plugins).to.be.equals({
        core: {
          name: 'core'
        },
        myPlugin1: {
          name: 'myPlugin1',
          dependencies: []
        },
        myPlugin2: {
          name: 'myPlugin2',
          dependencies: []
        }
      })

      hemera.close()
      done()

    })
  })

  it('Should be able to check duplicate registered plugins', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {

      let pluginOptions = {
        a: '1'
      }

      //Plugin
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

      //Plugin
      let plugin2 = function (options) {

        let hemera = this

        hemera.add({
          topic: 'math',
          cmd: 'sub'
        }, (resp, cb) => {

          cb(null, {
            result: resp.a + resp.b
          })
        })

      }

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
            name: 'myPlugin'
          },
          options: pluginOptions
        })

      } catch (e) {

        expect(e.name).to.be.equals('HemeraError')
        expect(e.message).to.be.equals('Plugin is already registered')
        hemera.close()
        done()
      }
    })
  })

})



describe('Logging interface', function () {

  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var noAuthUrl = 'nats://localhost:' + PORT
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
      info: function () {}
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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

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
  var noAuthUrl = 'nats://localhost:' + PORT
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
      crashOnFatal: false,
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
  var noAuthUrl = 'nats://localhost:' + PORT
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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

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
  var noAuthUrl = 'nats://localhost:' + PORT
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

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.ready(() => {

      expect(this.parentId$).to.be.not.exists()

      let traceId = '' //Is unique in a request

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

      hemera.on('onServerPreRequest', function (ctx) {

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

      hemera.on('onServerPreResponse', function (ctx) {

        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')

      })

      hemera.on('onClientPreRequest', function (ctx) {

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

      hemera.on('onClientPostRequest', function (ctx) {

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
  var noAuthUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('onClientPostRequest', function (done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      crashOnFatal: false
    })

    hemera.ready(() => {

      let plugin = function (options) {

        let hemera = this

        hemera._extensions.onClientPostRequest.subscribe(function (next) {

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

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      crashOnFatal: false
    })

    hemera.ready(() => {

      let plugin = function (options) {

        let hemera = this

        hemera._extensions.onClientPreRequest.subscribe(function (next) {

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

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      crashOnFatal: false
    })

    hemera.ready(() => {

      let plugin = function (options) {

        let hemera = this

        hemera._extensions.onServerPreRequest.subscribe(function (next) {

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

    const hemera = new Hemera(nats, {
      logLevel: 'silent',
      crashOnFatal: false
    })

    hemera.ready(() => {

      let plugin = function (options) {

        let hemera = this

        hemera._extensions.onServerPreResponse.subscribe(function (next) {

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