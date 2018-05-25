'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

const start = async () => {
  try {
    await hemera.ready()
    hemera.ext('onServerPreRequest', async () => {
      hemera.log.info('onServerPreRequest')
    })

    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      async function(req) {
        return req.a + req.b
      }
    )
    hemera.log.info(`Service listening`)
    // start request
    const out = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10
    })
    hemera.log.info(out.data)
  } catch (err) {
    hemera.log.error(err)
    process.exit(1)
  }
}
start()
