'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(async () => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    async function(req) {
      return await Promise.resolve(req.a + req.b)
    }
  )

  try {
    const result = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10
    })
    hemera.log.info(result)
  } catch (err) {
    hemera.log.error(err)
  }
})
