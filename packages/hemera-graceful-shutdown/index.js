'use strict'

const Hp = require('hemera-plugin')
const GracefulShutdown = require('./gracefulShutdown')

exports.plugin = Hp(function hemeraGracefulShutdown () {
  const hemera = this

  const gs = new GracefulShutdown()
  gs.process = process
  gs.logger = hemera.log
  gs.addHandler((signal, cb) => {
    hemera.log.info({ signal: signal }, 'triggering close hook')
    hemera.close(cb)
  })
  gs.init()
  hemera.decorate('gracefulShutdown', handler => gs.addHandler(handler))
}, '>=1.5.0')

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
