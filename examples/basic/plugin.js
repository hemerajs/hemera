'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const Hp = require('./../../packages/hemera-plugin')

const myPlugin = Hp(
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
  },
  {
    name: 'myPlugin',
    options: {},
    dependencies: []
  }
)

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(myPlugin)

hemera.ready()
