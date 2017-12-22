'use strict'

const Hemera = require('./../../packages/hemera')
const hemeraJoi = require('./../../packages/hemera-joi')
const nats = require('nats').connect({
  preserveBuffers: true
})
const HemeraRedisCache = require('hemera-redis-cache')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(HemeraRedisCache)

hemera.ready(() => {
  hemera
    .add({
      topic: 'math',
      cmd: 'add'
    })
    .use((req, reply) => {
      return hemera.act(`topic:redis-cache,cmd:get,key:foo`).then(result => {
        if (result) {
          console.log('Cached!')
          reply.end(result)
        }
      })
    })
    .end(req => {
      console.log('Refresh!')
      const op = req.a + req.b
      return hemera
        .act(`topic:redis-cache,cmd:set,key:foo,value:${op}`)
        .then(() => op)
    })

  hemera.act(`topic:math,cmd:add,a:1,b:2`, console.log)
})
