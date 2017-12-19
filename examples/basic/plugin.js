'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const Hp = require('./../../packages/hemera-plugin')

const myPlugin = Hp(function myPlugin(hemera, options, done) {
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
})

myPlugin[Symbol.for('dependencies')] = []
myPlugin[Symbol.for('name')] = 'foo'
myPlugin[Symbol.for('options')] = {}

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(myPlugin)

hemera.ready()
