'use strict'

const Http = require('http')
const EventEmitter = require('events')

function fakeServer () {
  const fake = new EventEmitter()
  const server = Http.createServer(function (req, res) {
    const body = []

    req.on('data', function (data) {
      body.push(data)
    })

    req.on('end', function () {
      const content = JSON.parse(Buffer.concat(body).toString('utf8'))

      fake.lastRequest = {
        url: req.url,
        body: content
      }

      res.statusCode = 200
      res.end()

      fake.emit('request', fake.lastRequest)
    })
  })

  server.listen.apply(server, arguments)

  fake.reset = function () {
    fake.lastRequest = null
    fake.removeAllListeners('request')
  }

  fake.stop = function () {
    fake.reset()
    server.close()
  }

  fake.server = server

  return fake
}

module.exports = fakeServer
