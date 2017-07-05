'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.ext('onServerPreRequest', async function (req, res) {
    await Promise.resolve()
  })

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, async function (req) {
    var result = await Promise.resolve({
      result: req.a - req.b
    })
    return result
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 10,
    b: 10
  }, async function (err, result) {
    await result
    return 'test'
  })
    .then(x => console.log(x))
})
