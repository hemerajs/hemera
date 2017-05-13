'use strict'

exports.plugin = function myPlugin (options) {
  var hemera = this

  hemera.expose('somethingToExpose', 4)

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}

/**
 * Usage
 *

  const Hemera = require('./../')
  const nats = require('nats').connect()

  const hemera = new Hemera(nats, { logLevel: 'info' })
  const plugin = require('./plugin-as-file')
  hemera.use(plugin, { ...plugin options })

  hemera.ready(() => {

  })

 */
