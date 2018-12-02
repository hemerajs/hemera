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
const { responseExtIterator, serverExtIterator } = require('./extensionRunner')

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
    this.isError = false
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
    if (this.sent === true) {
      this.log.warn(new Errors.HemeraError('Reply already sent'))
      return
    }

    this.sent = true

    // 0, null, '' can be send
    if (msg !== undefined) {
      if (msg instanceof Error) {
        this.error = msg
        this.payload = null
      } else {
        this.error = null
        this.payload = msg
      }
    }

    if (msg instanceof Error || this.isError === true) {
      this._handleError(msg, () => this._sendHook())
      return
    }

    this._sendHook()
  }

  _handleError(err, cb) {
    if (!(err instanceof Error)) {
      const internalError = new Errors.HemeraError(
        `Response error must be derivated from type 'Error' but got '${typeof err}'`
      )
      this.log.error(internalError)
      return
    }

    if (this.hemera._errorHandler) {
      const result = this.hemera._errorHandler(this.hemera, err, this.reply)
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            if (cb) {
              cb()
            }
          })
          .catch(err => {
            const internalError = new Errors.HemeraError(
              'error handler',
              this.hemera.errorDetails
            ).causedBy(err)
            this.log.error(internalError)
          })
        return
      }
    }

    if (cb) {
      cb()
    }
  }

  _sendHook() {
    runExt(
      this.hemera._extensionManager.onSend,
      serverExtIterator,
      this.hemera,
      err => this._sendHookCallback(err)
    )
  }

  /**
   *
   * @param {*} extensionError
   */
  _sendHookCallback(extensionError) {
    if (extensionError) {
      const internalError = new Errors.HemeraError(
        'onSend extension',
        this.hemera.errorDetails
      ).causedBy(extensionError)
      this.log.error(internalError)

      // first set error has precedence
      if (this.error === null) {
        this.sent = false
        this.send(extensionError)
        return
      }
    }

    this._send()
  }

  _send() {
    let msg = this.build(
      this.hemera.meta$,
      this.hemera.trace$,
      this.hemera.request$
    )

    // don't try to send encoding issues back because
    // it could end up in a endloss loop
    if (msg.error) {
      let internalError = new Errors.ParseError('Server encoding').causedBy(
        msg.error
      )
      this.log.error(internalError)
      this._handleError(msg.error)
      return
    }

    if (this._response.replyTo) {
      this.hemera._transport.send(this._response.replyTo, msg.value, err =>
        this._responseFlushed(err)
      )
    }
  }

  _responseFlushed(err) {
    if (err) {
      let internalError = new Errors.HemeraError('Nats transport').causedBy(err)
      this.log.error(internalError)
      this._handleError(internalError)
      return
    }

    runExt(
      this.hemera._extensionManager.onResponse,
      responseExtIterator,
      this.hemera,
      err => {
        if (err) {
          let internalError = new Errors.ParseError(
            'onResponse extension'
          ).causedBy(err)
          this.log.error(internalError)
          this._handleError(err)
        }
      }
    )
  }

  /**
   *
   * @param {*} meta$
   * @param {*} trace$
   * @param {*} request$
   */
  build(meta$, trace$, request$) {
    let message = {
      meta: meta$ || {},
      trace: trace$ || {},
      request: request$,
      result: this.error ? null : this.payload,
      error: this.error ? Errio.toObject(this.error) : null
    }

    return this.hemera._serverEncoder(message)
  }
}

module.exports = Reply
