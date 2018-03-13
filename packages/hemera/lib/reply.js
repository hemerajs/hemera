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
const MessageBuilder = require('./messageBuilder')

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
        self.error = msg
      } else {
        self.payload = msg
      }
    }

    self.serverPreResponse()
  }

  _preResponseIterator(fn, cb) {
    const ret = fn(this, this._request, this._reply, cb)
    if (ret && typeof ret.then === 'function') {
      ret.then(cb).catch(cb)
    }
  }

  serverPreResponse() {
    const self = this

    self.hemera._series(
      self.hemera,
      self._preResponseIterator,
      self.hemera._ext['onServerPreResponse'],
      err => self._onServerPreResponseCompleted(err)
    )
  }

  _onServerPreResponseCompleted(extensionError) {
    const self = this

    if (extensionError) {
      self.send(self.hemera._attachHops(extensionError))
      const internalError = new Errors.HemeraError(
        Constants.EXTENSION_ERROR,
        self.hemera.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.hemera.emit('serverResponseError', extensionError)
    }

    if (self._response.replyTo) {
      const msgBuilder = new MessageBuilder(self.hemera, self, self.hemera._encoderPipeline)
      const msg = msgBuilder.build(
        self.hemera.meta$,
        self.hemera.trace$,
        self.hemera.request$)

      self.hemera._transport.send(self._response.replyTo, msg.value)
    }
  }
}

module.exports = Reply
