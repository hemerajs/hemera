'use strict'

/**
 * For details https://nats.io/documentation/faq/#wildcards
 */

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'systems-europe.a.>',
      cmd: 'details'
    },
    (req, cb) => {
      cb(null, true)
    }
  )
  hemera.add(
    {
      topic: 'systems-europe.b.*',
      cmd: 'name'
    },
    (req, cb) => {
      cb(null, true)
    }
  )

  /**
   * Token wildcards
   */
  hemera.act(
    {
      topic: 'systems-europe.a.info.details',
      cmd: 'details'
    },
    function(err, resp) {
      if (err) {
        this.log.error(err)
        return
      }
      this.log.info(resp)
    }
  )

  /**
   * Full wildcards
   */
  hemera.act(
    {
      topic: 'systems-europe.b.info',
      cmd: 'name'
    },
    function(err, resp) {
      if (err) {
        this.log.error(err)
        return
      }
      this.log.info(resp)
    }
  )
})
