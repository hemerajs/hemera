'use strict'

var Wreck = require('wreck')

var HTTP_OK = 200
var HTTP_RECEIVED = 202

function httpSimpleTransport(body, options) {
  const path = 'http://' + options.host + ':' + options.port + options.path
  Wreck.post(path, {
    payload: [body]
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

module.exports = httpSimpleTransport
