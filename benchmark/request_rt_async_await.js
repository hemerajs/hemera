'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const PORT = 4222
const noAuthUrl = 'nats://localhost:' + PORT

const loop = 50000
const hash = 1000
let received = 0

const nats1 = Nats.connect(noAuthUrl)
const nats2 = Nats.connect(noAuthUrl)
const hemera1 = new Hemera(nats1)
const hemera2 = new Hemera(nats2)

hemera1.ready(() => {
  var start = new Date()

  hemera1.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    async function(req) {
      return await Promise.resolve(true)
    }
  )

  // Need to flush here since using separate connections.
  hemera1.transport.flush(() => {
    for (var i = 0; i < loop; i++) {
      hemera2.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          maxMessages$: 1
        },
        function(err, resp) {
          if (err) {
            throw err
          }
          received += 1

          if (received === loop) {
            var stop = new Date()
            var rps = parseInt(loop / ((stop - start) / 1000))
            console.log('\n' + rps + ' request-responses/sec')
            var lat = parseInt((stop - start) * 1000 / (loop * 2)) // Request=2, Reponse=2 RTs
            console.log('Avg roundtrip latency: ' + lat + ' microseconds')
            process.exit()
          } else if (received % hash === 0) {
            process.stdout.write('+')
          }
        }
      )
    }
  })
})
