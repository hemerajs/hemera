'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const PORT = 4222
const noAuthUrl = 'nats://localhost:' + PORT

const payloadSmall = require('./payloads/example_payload_small.json') // ~100KB
const payloadMedium = require('./payloads/example_payload_medium.json') // ~ 500KB
const payloadBig = require('./payloads/example_payload_big.json') // 990KB

// Don't forget to set gnats config to max_payload: 3145728 # 3MB to process file larger than 1 MB
const payloadExtraBig = require('./payloads/example_payload_extra_big.json') // 2.3MB

const nats1 = Nats.connect(noAuthUrl)

nats1.on('error', (err) => {
  console.error(err)
})

const nats2 = Nats.connect(noAuthUrl)

nats2.on('error', (err) => {
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

  hemera1.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, reply) {
    // response with big file
    return reply(null, payloadExtraBig)
  })

  nats1.flush(function () {
    hemera2.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2,
      data: payloadExtraBig // request with big file
    }, function (err, resp) {
      let stop = new Date()
      let time = parseInt((stop - start))
      console.log('\nRequest: ' + time + ' /ms')
      process.exit()
    })
  })
})
