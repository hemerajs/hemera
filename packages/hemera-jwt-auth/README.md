# Hemera-jwt-auth package

Granting and authenticating solution with JWT for Hemera

**Status**: _In development_

[![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

#### Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraJwt = require('hemera-jwt-auth')

// token encoded with { scope: ['math'] }
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJtYXRoIl0sImlhdCI6MTQ4ODEyMjIwN30.UPLLbjDgkB_ajQjI7BUlpUGfZYvsqHP3NqWQIavibeQ'

const hemera = new Hemera(nats)
hemera.use(hemeraJwt, {
  jwt: {
    secret: 'test'
  }
})

hemera.ready(() => {

  // 1. check if the token can be verified
  // 2. check scope
  hemera.add({
    topic: 'math',
    cmd: 'sub',
    auth$: {
      scope: 'math' // or an array of scopes
    }
  }, function (req, cb) {
    // access the decoded data
    let decoded = this.auth$

    cb(null, req.a - req.b)
  })

  // 1. check if the token can be verified
  // 2. check scope
  hemera.add({
    topic: 'math',
    cmd: 'add',
    auth$: { // or { enabled: false } if you want to disable authentication
      scope: 'math'
    }
  }, function (req, cb) {
    // token is passed to all nested acts
    this.act({
      topic: 'math',
      cmd: 'sub',
      a: req.a + req.b,
      b: 100
    }, function (err, res) {
      cb(err, res)
    })
  })

  // execute an action with your signed token
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

```
