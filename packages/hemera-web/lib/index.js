'use strict'

const {
  json, buffer, text
} = require('micro')
const Micro = require('micro')
const Hoek = require('hoek')
const Url = require('url')
const Qs = require('querystring')
const _ = require('lodash')
const Typeis = require('type-is')

const contentTypeJson = ['json']
const contentBinaryStream = ['application/octet-stream']
const contentText = ['text/*']
const contentForm = ['application/x-www-form-*', 'multipart']

/**
 *
 *
 * @class HttpMicro
 */
class HttpMicro {
  constructor (hemera, options) {
    this._hemera = hemera
    this._hemera.setConfig('generators', true) // generator / promise support
    this._options = options
    this._create()
  }

  /**
   *
   *
   *
   * @memberof HttpMicro
   */
  _create () {
    this._server = Micro(async(req, res) => {
      let pattern = Hoek.clone(this._options.pattern)

      let url = Url.parse(req.url, true)

      if (url.query) {
        pattern = Hoek.applyToDefaults(pattern, url.query)
      }

      const contentType = req.headers['content-type']
      const xRequestId = req.headers['x-request-id']

      // for tracing
      if (xRequestId) {
        pattern.requestParentId$ = xRequestId
      }

      // include json payload to pattern
      if (Typeis(req, contentTypeJson)) {
        const body = await json(req)

        if (body) {
          pattern = Hoek.applyToDefaults(pattern, body)
        }
      } else if (Typeis(req, contentForm)) { // include form data to pattern
        const body = await text(req)
        const post = Qs.parse(body)
        pattern = Hoek.applyToDefaults(pattern, post)
      } else if (Typeis(req, contentBinaryStream)) { // handle as raw binary data
        pattern.binaryData = await buffer(req) // limit 1MB
      } else if (contentText.indexOf(contentType) > -1) { // handle as raw text data
        pattern.textData = await text(req)
      }

      return this._hemera.act(pattern).catch((err) => {
        res.statusCode = err.statusCode || 500
        return {
          error: _.omit(err, ['stack'])
        }
      })
    })
  }

  /**
   *
   *
   *
   * @memberof HttpMicro
   */
  listen (cb) {
    this._server.listen(this._options.port, this._options.host, cb)
  }
}

module.exports = HttpMicro
