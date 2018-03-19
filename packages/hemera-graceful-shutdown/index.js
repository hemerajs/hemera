'use strict'

const Hp = require('hemera-plugin')
const GracefulShutdown = require('./gracefulShutdown')

function hemeraGracefulShutdown(hemera, opts, done) {
  const gs = new GracefulShutdown()
  gs.process = process
  gs.logger = hemera.log
  gs.addHandler((signal, cb) => {
    hemera.log.info({ signal: signal }, 'triggering close hook')
    hemera.close(cb)
  })
  gs.init()
  hemera.decorate('gracefulShutdown', handler => gs.addHandler(handler))
  done()
}

const plugin = Hp(hemeraGracefulShutdown, {
  hemera: '>=5.0.0-rc.1',
  name: require('./package.json').name
})

module.exports = plugin
