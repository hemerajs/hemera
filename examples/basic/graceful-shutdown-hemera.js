'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'debug'
})

/**
 * Cycle:
 *
 * 1. Fires OnClose extension in all registered plugins
 * 2. Unsubscribe all active subscriptions
 * 3. Waiting before all queued messages was proceed and then close hemera and nats
 *
 * Flush outbound queue to server and call optional callback when server has processed
 * all data. Error is passed by a plugin in 'onClose' extension.
 */

hemera.ready(() => {
  hemera.close(err => {
    console.error(err)
    process.exit(0)
  })
})
