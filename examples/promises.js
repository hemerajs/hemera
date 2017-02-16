'use strict'

const Hemera = require('./../packages/hemera')
const Promise = require('bluebird')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(function () {

  //wrap add method
  let add = (pattern, cb) => {

    this.add(pattern, function (resp, next) {

      new Promise((resolve, reject) => {
          
          resolve(cb.call(this, resp))

        })
        .then((result) => next(null, result))
        .catch(next)

    })
  }

  //wrap act method
  let act = (pattern) => {

    return new Promise((resolve, reject) => {

      return this.act(pattern, function (err, res) {

        if (err) {
          return reject(err)
        }

        resolve(res)
      })
    })
  }


  add({
    topic: 'math',
    cmd: 'add'
  }, (resp, cb) => {

    return resp.a + resp.b
  })

  act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }).then(function (resp) {

    hemera.log.info(resp, 'Result')
  })
})