'use strict'

const Axios = require('axios')

describe('Hemera-web', function () {
  const PORT = 6244
  const flags = ['--user', 'derek', '--pass', 'foobar']
  const authUrl = 'nats://derek:foobar@localhost:' + PORT
  let server
  let HemeraWeb

  // Start up our own nats-server
  before(function (done) {
    if (NodeVersion.major < 6) {
      return this.skip()
    }

    HemeraWeb = require('../../packages/hemera-web')

    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    if (NodeVersion.major < 6) {
      return this.skip()
    }

    server.kill()
  })

  it('Should be able to pass pattern with query parameters', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(null, { result: parseInt(req.a) + parseInt(req.b) })
      })

      Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2').then((resp) => {
        expect(resp.data.result).to.be.equals(3)
        hemera.close()
        done()
      })
      .catch(done)
    })
  })

  it('Should support blacklist for error propertys', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb, {
      errors: {
        propBlacklist: [] // default 'stack'
      }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        const err = new UnauthorizedError('test')
        err.statusCode = 404
        cb(err)
      })

      Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2')
      .catch((resp) => {
        expect(resp.response.data.error.stack).to.be.exists()
        expect(resp.response.status).to.be.equals(404)
        hemera.close()
        done()
      })
    })
  })

  it('Should not transfer the error stack', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        const err = new UnauthorizedError('test')
        err.statusCode = 404
        cb(err)
      })

      Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2')
      .catch((resp) => {
        expect(resp.response.data.error.stack).to.be.not.exists()
        expect(resp.response.status).to.be.equals(404)
        hemera.close()
        done()
      })
    })
  })

  it('Should respond with the correct statusCode', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        const err = new UnauthorizedError('test')
        err.statusCode = 404
        cb(err)
      })

      Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2')
      .catch((resp) => {
        expect(resp.response.status).to.be.equals(404)
        hemera.close()
        done()
      })
    })
  })

  it('Should respond with 500 when no statusCode was given', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(new Error('test'))
      })

      Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2')
      .catch((resp) => {
        expect(resp.response.status).to.be.equals(500)
        hemera.close()
        done()
      })
    })
  })

  it('Should be able to pass pattern with post payload', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(null, { result: parseInt(req.a) + parseInt(req.b) })
      })

      Axios.post('http://127.0.0.1:3000', {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }).then((resp) => {
        expect(resp.data.result).to.be.equals(3)
        hemera.close()
        done()
      })
      .catch(done)
    })
  })

  it('Should be able to define default pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb, {
      pattern: { topic: 'math' }
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(null, { result: parseInt(req.a) + parseInt(req.b) })
      })

      Axios.get('http://127.0.0.1:3000?cmd=add&a=1&b=2').then((resp) => {
        expect(resp.data.result).to.be.equals(3)
        hemera.close()
        done()
      })
      .catch(done)
    })
  })

  it('Should be able to transfer small text with pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(null, { result: parseInt(req.a) + parseInt(req.b), text: req.textData })
      })

      const instance = Axios.create()

      instance.defaults.headers.common['Content-Type'] = 'text/html'

      instance.post('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2', {
        textData: 'fooBar'
      }).then((resp) => {
        expect(resp.data.text).to.be.equals('fooBar')
        expect(resp.data.result).to.be.equals(3)
        hemera.close()
        done()
      })
      .catch(done)
    })
  })

  it('Should be able to transfer small binary files with pattern', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraWeb)

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (req, cb) {
        cb(null, { result: parseInt(req.a) + parseInt(req.b), binary: req.binaryData })
      })

      const buff = new Buffer('test')

      const instance = Axios.create()

      instance.defaults.headers.common['Content-Type'] = 'application/octet-stream'

      instance.post('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2', {
        binaryData: buff
      }).then((resp) => {
        expect(new Buffer(resp.data.binary).equals(buff)).to.be.equals(true)
        expect(resp.data.result).to.be.equals(3)
        hemera.close()
        done()
      })
      .catch(done)
    })
  })
})
