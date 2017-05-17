'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()
const promiseRetry = require('promise-retry')

const hemera = new Hemera(nats, {
  logLevel: 'silent',
  generators: true
})

hemera.ready(() => {
  const opt = { retries: 2 }

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function * (req, cb) {
    return Promise.reject(new Error('Uuups!'))
  })

  promiseRetry(function (retry, number) {
    console.log('Attempt number', number)

    return hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 20
    })
    .catch(retry)
  }, opt)
    .then(function (value) {
      console.log(value)
    }, function (err) {
      console.error(err)
    })
})
