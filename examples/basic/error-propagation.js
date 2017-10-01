'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
const UnauthorizedError = Hemera.createError('Unauthorized')

hemera.ready(() => {
  hemera.add(
    {
      topic: 'a',
      cmd: 'a'
    },
    function (resp, cb) {
      this.act(
        {
          topic: 'b',
          cmd: 'b'
        },
        function (err, resp) {
          this.act(
            {
              topic: 'c',
              cmd: 'c'
            },
            function (err, resp) {
              cb(err, resp)
            }
          )
        }
      )
    }
  )
  hemera.add(
    {
      topic: 'b',
      cmd: 'b'
    },
    (resp, cb) => {
      const a = new UnauthorizedError('test')
      a.test = 444
      cb(a)
    }
  )
  hemera.add(
    {
      topic: 'c',
      cmd: 'c'
    },
    function (resp, cb) {
      this.act(
        {
          topic: 'b',
          cmd: 'b'
        },
        function (err, resp) {
          cb(err, resp)
        }
      )
    }
  )

  hemera.act(
    {
      topic: 'a',
      cmd: 'a'
    },
    function (err, resp) {
      this.log.info('Error name: %s', err.name)
      this.log.info('Error message: %s', err.message)
      this.log.info('Custom error data: test=%s', err.test)
      this.log.info(err.hops, 'network hops')
    }
  )
})
