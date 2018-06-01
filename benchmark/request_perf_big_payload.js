'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const PORT = 4222
const noAuthUrl = 'nats://localhost:' + PORT

let payload = require('./payloads/example_payload_small.json') // ~100KB
// payload = require('./payloads/example_payload_medium.json') // ~ 500KB
// payload = require('./payloads/example_payload_big.json') // 990KB

// Don't forget to set gnats config to max_payload: 3145728 # 3MB to process file larger than 1 MB
// payload = require('./payloads/example_payload_extra_big.json') // 2.3MB

const nats1 = Nats.connect(noAuthUrl)

nats1.on('error', err => {
  console.error(err)
})

const nats2 = Nats.connect(noAuthUrl)

nats2.on('error', err => {
  console.error(err)
})

const hemera1 = new Hemera(nats1, {
  logLevel: 'info'
})
const hemera2 = new Hemera(nats2, {
  logLevel: 'info'
})

hemera1.ready(() => {
  var start = new Date()

  hemera1.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, reply) {
      return reply(null, req.data)
    }
  )

  // Need to flush here since using separate connections.
  hemera1.transport.flush(() => {
    hemera2.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        data: payload
      },
      function(err, resp) {
        if (err) {
          throw err
        }
        let stop = new Date()
        let time = parseInt(stop - start)
        console.log('\nRequest: ' + time + ' /ms')
        process.exit()
      }
    )
  })
})
