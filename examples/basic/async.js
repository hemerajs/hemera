'use strict'

const Hemera = require('./../../packages/hemera')
const parallel = require('async/parallel')
const compose = require('async/compose')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )

  /**
   * Control flow
   * Execute multiple acts in parallel
   */
  parallel(
    [
      callback => {
        hemera.act('topic:math,cmd:add,a:1,b:2', callback)
      },
      callback => {
        hemera.act('topic:math,cmd:add,a:2,b:2', callback)
      },
      callback => {
        hemera.act('topic:math,cmd:add,a:3,b:2', callback)
      }
    ],
    function(err, results) {
      console.log(err, results)
    }
  )

  /**
   * Composition
   */
  const add1 = (n, callback) => {
    hemera.act({ topic: 'math', cmd: 'add', a: n, b: 1 }, callback)
  }
  const add2 = (n, callback) => {
    hemera.act({ topic: 'math', cmd: 'add', a: n, b: 2 }, callback)
  }

  const add1and2 = compose(add1, add2)
  add1and2(10, function(err, result) {
    console.log(err, result)
  })

  /**
   * For more examples see http://caolan.github.io/async/docs.html
   */
})
