'use strict'

const {
  json
} = require('micro')
const Micro = require('micro')
const Hoek = require('hoek')
const Url = require('url')
const _ = require('lodash')

const contentTypeJson = ['application/json', 'application/javascript']

/**
 * 
 * 
 * @class HttpMicro
 */
class HttpMicro {
  constructor(hemera, options) {
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
  _create() {
    this._server = Micro(async(req, res) => {
      let pattern = Hoek.clone(this._options.pattern)

      let url = Url.parse(req.url, true)

      if (url.query) {
        pattern = Hoek.applyToDefaults(pattern, url.query)
      }

      const contentType = req.headers['content-type']

      if (contentTypeJson.indexOf(contentType) > -1) {
        const body = await json(req)

        if (body) {
          pattern = Hoek.applyToDefaults(pattern, body)
        }
      }

      res.setHeader('content-type', 'application/json')

      return await this._hemera.act(pattern).catch((err) => {
        return { error: _.omit(err, ['stack', 'ownStack']) }
      })
    })
  }

  /**
   * 
   * 
   * 
   * @memberof HttpMicro
   */
  listen() {
    this._server.listen(this._options.port)
  }
}

module.exports = HttpMicro