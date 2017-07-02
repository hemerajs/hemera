'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraZipkin = require('./../../packages/hemera-zipkin')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true,
  tag: 'user-service'
})

hemera.use(hemeraZipkin, {
  host: '127.0.0.1',
  sampling: 1 // trace any request
})

hemera.ready(() => {
  hemera.add({
    topic: 'search',
    cmd: 'friends'
  }, function (req, cb) {
    cb(null, true)
  })

  hemera.add({
    topic: 'email',
    cmd: 'send'
  }, function (req, cb) {
    cb(null, true)
  })

  hemera.add({
    topic: 'account',
    cmd: 'delete'
  }, function (req, cb) {
    cb(null, true)
  })

  hemera.add({
    topic: 'profile',
    cmd: 'get'
  }, function (req, cb) {
    this.delegate$.query = 'SELECT FROM User;'
    cb(null, true)
  })

  hemera.add({
    topic: 'auth',
    cmd: 'login'
  }, function (req, cb) {
    this.act('topic:profile,cmd:get', function () {
      this.act('topic:email,cmd:send', function () {
        this.act('topic:account,cmd:delete', cb)
      })
    })
    this.act('topic:email,cmd:send', function (err, result) {
      this.act('topic:search,cmd:friends')
    })
  })
  hemera.act('topic:auth,cmd:login')
  hemera.act('topic:search,cmd:friends')
})
