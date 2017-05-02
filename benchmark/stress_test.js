'use strict'

const Hemera = require('./../packages/hemera')
const Nats = require('nats')

const nats = Nats.connect()
const hemera = new Hemera(nats, {
  logLevel: 'silent',
  load: {
    sampleInterval: 100
  }
})

let i = 0
let rounds = 0
let maxRounds = 10
let interval = 2500
let messages = 10000

hemera.ready(() => {

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    cb()
  })

  function act() {

    if (i > messages) {
      i = 0
      rounds += 1

      if (rounds === maxRounds) {
        console.log('END: ----------------------')
        console.log('Load: ', hemera.load)
        return hemera.close()
      }

      console.log(`ROUND ${rounds}: ----------------------`)
      console.log('Load: ', hemera.load)

      return setTimeout(act, interval)
    }

    hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    }, function (err, resp) {
      i += 1
      act()
    })
  }

  console.log(`Send ${messages} msg every ${interval / 1000} sec for at least ${maxRounds} rounds.`)
  console.log()

  // run
  act()

})