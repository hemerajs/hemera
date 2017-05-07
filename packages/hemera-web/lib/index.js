'use strict'

const {
  json, buffer, text
} = require('micro')
const Micro = require('micro')
const Hoek = require('hoek')
const Url = require('url')
const Qs = require('querystring')
const _ = require('lodash')

const contentTypeJson = ['application/json', 'application/javascript']
const contentBinaryStream = ['application/octet-stream']
const contentText = ['text/plain', 'text/html']
const contentForm = ['application/x-www-form-urlencoded']

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

      // include json payload to pattern
      if (contentTypeJson.indexOf(contentType) > -1) {
        const body = await json(req)

        if (body) {
          pattern = Hoek.applyToDefaults(pattern, body)
        }
      } else if (contentForm.indexOf(contentType) > -1) { // include form data to pattern
        const body = await text(req)
        const post = Qs.parse(body)
        pattern = Hoek.applyToDefaults(pattern, post)
      } else if (contentBinaryStream.indexOf(contentType) > -1) { // handle as raw binary data
        pattern.binaryData = await buffer(req) // limit 1MB
      } else if (contentText.indexOf(contentType) > -1) { // handle as raw text data
        pattern.textData = await text(req)
      }

      return this._hemera.act(pattern).catch((err) => {
        return {
          error: _.omit(err, ['stack', 'ownStack'])
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
  listen () {
    this._server.listen(this._options.url)
  }
}

module.exports = HttpMicro
