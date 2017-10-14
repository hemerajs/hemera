'use strict'

const HemeraPlugin = require('./../../packages/hemera-plugin')

exports.plugin = HemeraPlugin(function myPlugin(hemera, opts, done) {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )

  done()
})

exports.options = {
  name: require('./package.json').name
  //.. options
}

/**
 * Usage
 *

  const Hemera = require('./../')
  const nats = require('nats').connect()

  const hemera = new Hemera(nats, { logLevel: 'info', childLogger: true })
  const plugin = require('./plugin-as-file')
  hemera.use(plugin)

  hemera.ready(err => {

  })

 */
