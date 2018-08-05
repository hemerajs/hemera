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
const Errio = require('errio')
const runExt = require('./extensionRunner').extRunner
const serverExtIterator = require('./extensionRunner').serverExtIterator

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
    this._response.error = this.hemera._attachHops(
      this.hemera.getRootError(value)
    )
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
      self.log.warn(new Errors.HemeraError('Reply already sent'))
      return
    }

    self.sent = true

    // 0, null, '' can be send
    if (msg !== undefined) {
      if (msg instanceof Error) {
        self.error = msg
      } else {
        self.payload = msg
      }
    }

    self.serverPreResponse()
  }
  /**
   *
   */
  serverPreResponse() {
    const self = this

    self.hemera.emit('serverPreResponse', self.hemera)

    if (self.hemera._extensionManager.onServerPreResponse.length) {
      runExt(
        self.hemera._extensionManager.onServerPreResponse,
        serverExtIterator,
        self.hemera,
        err => self._onServerPreResponseCompleted(err)
      )
    } else {
      self._onServerPreResponseCompleted()
    }
  }
  /**
   *
   * @param {*} extensionError
   */
  _onServerPreResponseCompleted(extensionError) {
    const self = this

    if (extensionError) {
      const internalError = new Errors.HemeraError(
        'onServerPreResponse extension',
        self.hemera.errorDetails
      ).causedBy(extensionError)
      self.log.error(internalError)
      self.hemera.emit('serverResponseError', extensionError)
      // don't use send() here in order to avoid rexecution of serverPreResponse
      // and to send the "send-error" as final response
      self.error = extensionError
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

    let msg = self.hemera._serverEncoder(message)

    if (msg.error) {
      let internalError = new Errors.ParseError(
        'Server payload encoding'
      ).causedBy(msg.error)
      self.log.error(internalError)
      self.hemera.emit('serverResponseError', msg.error)
      message.error = Errio.toObject(msg.error)
      message.result = null
      msg = self.hemera._serverEncoder(message)
    }

    return msg
  }
}

module.exports = Reply
