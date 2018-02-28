'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

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

const start = async () => {
  try {
    await hemera.ready()
    hemera.log.info(`service listening`)
    // start request
    const result = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10
    })
    hemera.log.info(result)
  } catch (err) {
    hemera.log.error(err)
    process.exit(1)
  }
}
start()
