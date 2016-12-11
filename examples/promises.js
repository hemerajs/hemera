'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(function () {

  //wrap add method
  let add = (pattern, cb) => {

    this.add(pattern, function (resp, next) {

      Promise.resolve(cb.call(this, resp)).then(function (result) {

          return next(null, result)
        })
        .catch(function (err) {

          return next(err);
        })
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
      });
    });
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

    hemera.log.info('Result', resp)
  })
})
