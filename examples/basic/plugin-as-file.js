'use strict'

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

module.exports = myPlugin
