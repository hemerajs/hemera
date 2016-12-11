'use strict'

var Wreck = require('wreck')

var HTTP_OK = 200
var HTTP_RECEIVED = 202

var DEFAULT_BATCH_SIZE = 5
var DEFAULT_BATCH_TIMEOUT = 1000

var queue = []
var timer = null

function send(body, options) {
  clearTimeout(timer)
  timer = null

  if (body.length === 0) {
    return
  }

  const path = 'http://' + options.host + ':' + options.port + options.path
  Wreck.post(path, {
    payload: body
  }, function sent(err, response, body) {
    if (!options.debug) {
      return
    }

    if (err) {
      return console.log('An error occurred sending trace data', err)
    }

    if (response.statusCode !== HTTP_OK && response.statusCode !== HTTP_RECEIVED) {
      return console.log('Server returned an error:', response.statusCode, '\n', body.toString())
    }
  })
}

function flush(options) {
  send(queue.splice(0, queue.length), options)
}

function httpBatchTransport(data, options) {
  queue.push(data)

  if (queue.length >= (options.batchSize || DEFAULT_BATCH_SIZE)) {
    send(queue.splice(0, queue.length), options)
  } else if (!timer) {
    timer = setTimeout(function () {
      flush(options)
    }, options.batchTimeout || DEFAULT_BATCH_TIMEOUT)
  }
}


module.exports = httpBatchTransport
