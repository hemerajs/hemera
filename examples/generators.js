'use strict'

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info',
  generators: true
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, function* (req) {
    var result = yield Promise.resolve({
      result: req.a - req.b
    })
    return result
  })

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function* (req) {
    const add = yield Promise.resolve({
      result: req.a + req.b
    })
    const sub = yield this.act('topic:math,cmd:sub,a:30,b:5')

    return { result: sub.result + add.result }
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 10,
    b: 20
  })
    .then(x => console.log(x))

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 10,
    b: 10
  }, function* (err, result) {
    return yield result
  })
    .then(x => console.log(x))
})
