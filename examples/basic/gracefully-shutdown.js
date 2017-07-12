'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

/**
 * Cycle:
 *
 * 1. Remove all active subscriptions
 * 2. Waiting before all queued messages was proceed and then close hemera and nats
 * 3. Close the underlying NATS connection and fires OnClose extension in all registered plugins.
 *
 * If you don't provide a callback NATS has no chance to process queued messages.
 */

hemera.ready(() => {
  hemera.close(() => process.exit(1))
})
