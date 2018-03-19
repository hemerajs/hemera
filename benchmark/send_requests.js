'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const PORT = 4222
const noAuthUrl = 'nats://localhost:' + PORT

var loop = 50000
var hash = 1000
var received = 0

const nats = Nats.connect(noAuthUrl)
const hemera = new Hemera(nats)

hemera.ready(() => {
  var start = new Date()

  for (var i = 0; i < loop; i++) {
    hemera.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
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
