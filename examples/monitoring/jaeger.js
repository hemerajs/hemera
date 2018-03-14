'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraJaeger = require('./../../packages/hemera-jaeger')
const HemeraJoi = require('./../../packages/hemera-joi')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true,
  tag: 'math'
})

hemera.use(hemeraJaeger, {
  serviceName: 'math'
})

hemera.use(HemeraJoi)

hemera.ready(() => {
  const Joi = hemera.joi

  hemera.add(
    {
      topic: 'search',
      cmd: 'friends'
    },
    function(req, cb) {
      cb(null, true)
    }
  )

  hemera.add(
    {
      topic: 'email',
      cmd: 'send'
    },
    function(req, cb) {
      setTimeout(() => cb(null, true), 100)
    }
  )

  hemera.add(
    {
      topic: 'account',
      cmd: 'delete'
    },
    function(req, cb) {
      cb(null, true)
    }
  )

  hemera.add(
    {
      topic: 'profile',
      cmd: 'get',
      id: Joi.number().required()
    },
    function(req, cb) {
      this.delegate$.query = 'SELECT FROM User;'
      cb(null, true)
    }
  )

  hemera.add(
    {
      topic: 'auth',
      cmd: 'login'
    },
    function(req, cb) {
      this.act('topic:profile,cmd:get,id:1', function() {
        this.act('topic:email,cmd:send', function() {
          this.act('topic:account,cmd:delete', cb)
        })
      })
      this.act('topic:email,cmd:send', function(err, result) {
        this.act('topic:search,cmd:friends')
      })
    }
  )
  hemera.act('topic:auth,cmd:login')
  hemera.act('topic:search,cmd:friends')
})
