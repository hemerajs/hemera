'use strict'

const _ = require('lodash')
const Express = require('express')
const BodyParser = require('body-parser')
const Hp = require('hemera-plugin')

const contentTypeJson = ['json']
const contentBinaryStream = ['application/octet-stream']
const contentText = ['text/*']
const contentForm = ['application/x-www-form-*', 'multipart']

function hemeraWeb(hemera, opts, done) {
  const app = Express()
  app.use(BodyParser.json())

  app.get('/', handler)
  app.post('/', handler)

  app.get('/:topic', handler)
  app.post('/:topic', handler)

  app.get('/:topic/:cmd', handler)
  app.post('/:topic/:cmd', handler)

  function getBasePattern(request, basePattern) {
    let obj = {}

    if (typeof basePattern === 'function') {
      obj = basePattern(request) || {}
    } else {
      obj = basePattern || {}
    }

    return obj
  }

  function handler(req, res) {
    const xRequestTraceId = req.headers['x-request-trace-id']
    const xRequestSpanId = req.headers['x-request-span-id']

    let pattern = getBasePattern(req, opts.pattern)
    if (req.query) {
      pattern = Object.assign(pattern, req.query)
    }
    // for tracing
    if (xRequestTraceId) {
      pattern.trace$ = pattern.trace$ || {}
      pattern.trace$.traceId = xRequestTraceId
    }
    if (xRequestSpanId) {
      pattern.trace$ = pattern.trace$ || {}
      pattern.trace$.parentSpanId = xRequestSpanId
    }
    // respect params
    if (req.params.topic) {
      pattern.topic = req.params.topic
    }
    if (req.params.cmd) {
      pattern.cmd = req.params.cmd
    }

    // include json payload to pattern
    if (req.is(contentTypeJson)) {
      const body = req.body
      if (body) {
        pattern = Object.assign(pattern, body)
      }
    } else if (req.is(contentForm)) {
      // include form data to pattern
      const body = req.body
      pattern = Object.assign(pattern, body)
    } else if (req.is(contentBinaryStream)) {
      // handle as raw binary data
      pattern.binaryData = req.body
    } else if (req.is(contentText)) {
      // handle as raw text data
      pattern.textData = req.body
    }

    hemera.act(pattern, function(err, result) {
      if (err) {
        res.statusCode = err.statusCode || 500
        res.send({
          error: _.omit(err, opts.errors.propBlacklist)
        })
      } else {
        res.send(result)
      }
    })
  }

  const server = app.listen(opts.port, opts.host, () => {
    hemera.log.info(`HTTP Server listening on: ${opts.host}:${opts.port}`)
    done()
  })

  hemera.decorate('express', app)

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    server.close()
    hemera.log.debug('Http server closed!')
    done()
  })
}

const plugin = Hp(hemeraWeb, {
  hemera: '>=5.0.0-rc.1',
  name: require('./package.json').name,
  options: {
    port: 3000,
    host: '127.0.0.1',
    errors: {
      propBlacklist: ['stack']
    },
    pattern: {}
  }
})

module.exports = plugin
