'use strict'

const Hoek = require('hoek')
const _ = require('lodash')
const Express = require('express')
const BodyParser = require('body-parser')
const Hp = require('hemera-plugin')

const contentTypeJson = ['json']
const contentBinaryStream = ['application/octet-stream']
const contentText = ['text/*']
const contentForm = ['application/x-www-form-*', 'multipart']

exports.plugin = Hp(function hemeraWeb (options, next) {
  const hemera = this

  const app = Express()
  app.use(BodyParser.json())

  app.get('/', handler)
  app.post('/', handler)

  function handler (req, res) {
    const xRequestId = req.headers['x-request-id']
    let pattern = Hoek.clone(options.pattern)
    if (req.query) {
      pattern = Hoek.applyToDefaults(pattern, req.query)
    }
    // for tracing
    if (xRequestId) {
      pattern.requestParentId$ = xRequestId
    }

    // include json payload to pattern
    if (req.is(contentTypeJson)) {
      const body = req.body
      if (body) {
        pattern = Hoek.applyToDefaults(pattern, body)
      }
    } else if (req.is(contentForm)) { // include form data to pattern
      const body = req.body
      pattern = Hoek.applyToDefaults(pattern, body)
    } else if (req.is(contentBinaryStream)) { // handle as raw binary data
      pattern.binaryData = req.body
    } else if (req.is(contentText)) { // handle as raw text data
      pattern.textData = req.body
    }

    hemera.act(pattern, function (err, result) {
      if (err) {
        res.statusCode = err.statusCode || 500
        res.send({
          error: _.omit(err, options.errors.propBlacklist)
        })
      } else {
        res.send(result)
      }
    })
  }

  const server = app.listen(options.port, options.host, () => {
    hemera.log.info(`HTTP Server listening on: ${options.host}:${options.port}`)
    next()
  })

  hemera.expose('express', app)

  // Gracefully shutdown
  hemera.ext('onClose', (done) => {
    server.close()
    hemera.log.debug('Http server closed!')
    done()
  })
}, '>= 1.3.2')

exports.options = {
  port: 3000,
  host: '127.0.0.1',
  errors: {
    propBlacklist: ['stack']
  },
  pattern: {}
}

exports.attributes = {
  pkg: require('./package.json')
}
