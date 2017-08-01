'use strict'

describe('Extension reply', function () {
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

  it('Should be able to reply an error', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
        ext1()
        res.send(new Error('test'))
      })

      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
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
        hemera.close(done)
      })
    })
  })

  it('end', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
        ext1()
        res.end({
          msg: 'unauthorized'
        })
      })

      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
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
        hemera.close(done)
      })
    })
  })

  it('send', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
        ext1()
        res.send({
          msg: 'unauthorized'
        })
      })

      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
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
        hemera.close(done)
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
      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.undefined()
        ext1()
        next()
      })

      hemera.ext('onServerPreRequest', function (ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.undefined()
        ext2()
        next()
      })

      hemera.ext('onServerPreResponse', function (ctx, req, res, next) {
        expect(req.payload).to.be.an.object()
        expect(req.error).to.be.a.null()
        expect(res.payload).to.be.an.object()
        expect(res.error).to.be.null()
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
        hemera.close(done)
      })
    })
  })

  it('Should be able to manipulate response payload in server extensions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreResponse', function (ctx, req, res, next) {
        res.payload = 1
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
        expect(resp).to.be.equals(1)
        hemera.close(done)
      })
    })
  })

  it('Should be able to manipulate response error payload in server extensions', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreResponse', function (ctx, req, res, next) {
        res.error = new Error('test')
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
        expect(err).to.be.exists()
        expect(err.message).to.be.equals('test')
        hemera.close(done)
      })
    })
  })

  it('Should pass the response to the next', function (done) {
    let ext1 = Sinon.spy()
    let ext2 = Sinon.spy()

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
        ext1()
        next()
      })

      hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
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
        hemera.close(done)
      })
    })
  })
})
