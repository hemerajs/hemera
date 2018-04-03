'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.setNotFoundPattern({
    topic: 'math',
    cmd: 'notFound'
  })

  hemera.add(
    {
      topic: 'math',
      cmd: 'notFound'
    },
    (req, cb) => {
      cb(null, true)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'dedede'
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
