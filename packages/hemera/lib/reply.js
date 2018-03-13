'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Errors = require('./errors')
const Constants = require('./constants')
const Errio = require('errio')

/**
 * @TODO rename hook to onServerSend
 *
 * @class Reply
 */
class Reply {
  /**
   * Creates an instance of Reply.
   * @param {any} request
   * @param {any} response
   * @param {any} hemera
   * @param {any} logger
   *
   * @memberof Reply
   */
  constructor(request, response, hemera, logger) {
    this._request = request
    this._response = response
    this.hemera = hemera
    this.log = logger
    this.sent = false
  }

  /**
   *
   *
   * @param {any} payload
   *
   * @memberof Reply
   */
  set payload(value) {
    this._response.payload = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get payload() {
    return this._response.payload
  }

  /**
   * Set the response error
   * Error can not be set twice
   *
   * @memberof Reply
   */
  set error(value) {
    this._response.error = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get error() {
    return this._response.error
  }
  /**
   *
   */
  next(msg) {
    this.sent = false
    this.send(msg)
  }

  /**
   * Set the response payload or error
   *
   * @param {any} msg
   * @memberof Reply
   */
  send(msg) {
    const self = this

    if (self.sent) {
      self.log.warn(new Error(Constants.REPLY_ALREADY_SENT))
      return
    }

    self.sent = true

    if (msg !== undefined) {
      if (msg instanceof Error) {
        self.error = self.hemera._attachHops(self.hemera.getRootError(msg))
      } else {
        self.payload = msg
      }
    }

    self.serverPreResponse()
  }
  /**
   *
   * @param {*} fn
   * @param {*} cb
   */
  _preResponseIterator(fn, cb) {
    const ret = fn(this, this._request, this.reply, cb)
    if (ret && typeof ret.then === 'function') {
      ret.then(cb).catch(cb)
    }
  }
  /**
   *
   */
  serverPreResponse() {
    const self = this

    self.hemera._series(
      self.hemera,
      self._preResponseIterator,
      self.hemera._ext['onServerPreResponse'],
      err => self._onServerPreResponseCompleted(err)
    )
  }
  /**
   *
   * @param {*} extensionError
   */
  _onServerPreResponseCompleted(extensionError) {
    const self = this

    if (extensionError) {
      self.send(extensionError)
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.hemera.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.hemera.emit('serverResponseError', extensionError)
    }

    if (self._response.replyTo) {
      const msg = self.build(
        self.hemera.meta$,
        self.hemera.trace$,
        self.hemera.request$
      )

      self.hemera._transport.send(self._response.replyTo, msg.value)
    }
  }
  /**
   *
   * @param {*} meta$
   * @param {*} trace$
   * @param {*} request$
   */
  build(meta$, trace$, request$) {
    const self = this

    let message = {
      meta: meta$ || {},
      trace: trace$ || {},
      request: request$,
      result: self.error ? null : self.payload,
      error: self.error ? Errio.toObject(self.error) : null
    }

    let msg = self.hemera._encoderPipeline.run(message, self)

    if (msg.error) {
      let internalError = new Errors.ParseError(
        Constants.PAYLOAD_PARSING_ERROR
      ).causedBy(msg.error)
      message.error = Errio.toObject(internalError)
      message.result = null
      msg = self.hemera._encoderPipeline.run(message, self)
    }

    return msg
  }
}

module.exports = Reply
