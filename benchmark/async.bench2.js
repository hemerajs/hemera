'use strict'

const Hemera = require('./../packages/hemera'),
  nsc = require('hemera-testsuite'),
  Code = require('code'),
  Async = require("async")

const PORT = 6242;
const flags = ['--user', 'derek', '--pass', 'foobar']
const authUrl = 'nats://derek:foobar@localhost:' + PORT
const noAuthUrl = 'nats://localhost:' + PORT
const server = nsc.start_server(PORT, flags, () => {

  const nats = require('nats').connect(authUrl)
  const hemera = new Hemera(nats)

  hemera.ready(() => {

    hemera.add({
      topic: 'math',
      cmd: 'add'
    }, (resp, cb) => {

      cb(null, {
        result: resp.a + resp.b
      })

    })

    function act(cb) {

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        cb(err, resp)
      });
    }

    let t1 = new Date()

    let count = 0

    Async.whilst(
      function () {
        return count < 5000
      },
      function (callback) {
        count++

        act(callback)
      },
      function (err, n) {

        let offset = ((new Date) - t1)
        console.log(`Calls: ${count}, Measure: ${offset} ms, Average: ${offset/count} ms`)

        hemera.close()
        server.kill()

      }
    )

  })


})