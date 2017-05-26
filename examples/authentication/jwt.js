'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraJwt = require('./../../packages/hemera-jwt-auth')

// encoded token with { scope: ['math'] }
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJtYXRoIl0sImlhdCI6MTQ4ODEyMjIwN30.UPLLbjDgkB_ajQjI7BUlpUGfZYvsqHP3NqWQIavibeQ'

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})
hemera.use(hemeraJwt, {
  jwt: {
    secret: 'test'
  }
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'sub',
    auth$: {
      scope: 'math'
    }
  }, function (req, cb) {
    cb(null, req.a - req.b)
  })
  hemera.add({
    topic: 'math',
    cmd: 'add',
    auth$: {
      scope: 'math'
    }
  }, function (req, cb) {
    this.act({
      topic: 'math',
      cmd: 'sub',
      a: req.a + req.b,
      b: 100
    }, function (err, res) {
      cb(err, res)
    })
  })

  hemera.act({
    meta$: {
      jwtToken
    },
    topic: 'math',
    cmd: 'add',
    a: 100,
    b: 200
  }, function (err, resp) {
    console.log(resp)
  })
})
