'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const HemeraGracefulShutdown = require('./../../packages/hemera-graceful-shutdown')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(HemeraGracefulShutdown)

hemera.ready(function() {
  hemera.ext('onClose', (ctx, next) => {
    this.log.info('Triggered!')
    next()
  })
  hemera.gracefulShutdown((signal, next) => {
    this.log.info('Triggered custom handler!')
    next()
  })
})

// PRESS CTRL+C
