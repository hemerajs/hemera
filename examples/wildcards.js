'use strict'

/**
 * For details https://nats.io/documentation/faq/#wildcards
 */

const Hemera = require('./../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add({
    topic: 'systems-europe.a.>',
    cmd: 'info'
  }, (req, cb) => {
    cb(null, true)
  })
  hemera.add({
    topic: 'systems-europe.b.*',
    cmd: 'info'
  }, (req, cb) => {
    cb(null, true)
  })
  /**
   * Token wilcards
   */
  hemera.act({
    topic: 'systems-europe.a.info.details',
    cmd: 'info'
  }, function (err, resp) {
    this.log.info(resp, 'Result')
  })
  /**
   * Full wilcards
   */
  hemera.act({
    topic: 'systems-europe.b.info',
    cmd: 'info'
  }, function (err, resp) {
    this.log.info(resp, 'Result')
  })
})
