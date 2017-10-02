'use strict'

const HemeraPlugin = require('./../../packages/hemera-plugin')

function myPlugin(hemera, options, done) {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (resp, cb) => {
      cb(null, resp.a + resp.b)
    }
  )

  done()
}

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

const plugin = HemeraPlugin({
  plugin: myPlugin,
  options: { name: 'foo' }
})

hemera.use(plugin)

hemera.ready(() => {
  // hemera is bootstrapped
})
