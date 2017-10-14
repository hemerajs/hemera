'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const PORT = 4222
const flags = ['--user', 'derek', '--pass', 'foobar']
const authUrl = 'nats://derek:foobar@localhost:' + PORT
const noAuthUrl = 'nats://localhost:' + PORT

let start
const loop = 100000
const hash = 5000
let received = 0

console.log('Subscribe Performance Test')
console.log('Waiting on %d messages', loop)

const nats = Nats.connect(noAuthUrl)
const hemera = new Hemera(nats)

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (resp, cb) => {
      received += 1

      if (received === 1) {
        start = new Date()
      }

      if (received === loop) {
        var stop = new Date()
        console.log('\nDone test')
        var mps = parseInt(loop / ((stop - start) / 1000))
        console.log('Received at ' + mps + ' msgs/sec')
        process.exit()
      } else if (received % hash === 0) {
        process.stdout.write('+')
      }

      cb()
    }
  )
})
