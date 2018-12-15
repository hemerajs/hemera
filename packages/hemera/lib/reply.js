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

class Reply {
  constructor(request, response, hemera, logger) {
    this._request = request
    this._response = response
    this.hemera = hemera
    this.log = logger
    this.sent = false
    this.isError = false
  }

  set payload(value) {
    this._response.payload = value
  }

  get payload() {
    return this._response.payload
  }

  set error(value) {
    this._response.error = this.hemera._attachHops(
      this.hemera.getRootError(value)
    )
  }

  get error() {
    return this._response.error
  }

  next(msg) {
    this.sent = false
    this.send(msg)
  }

  send(msg) {
    if (this.sent === true) {
      this.log.warn(new Errors.HemeraError('Reply already sent'))
      return
    }

    this.sent = true

    const isNativeError = msg instanceof Error

    // 0, null, '' can be send
    if (msg !== undefined) {
      if (isNativeError) {
        this.error = msg
        this.payload = null
      } else {
        this.error = null
        this.payload = msg
      }
    }

    if (this.isError === true || isNativeError) {
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
      this.hemera._transport.send(this._response.replyTo, msg.value)
    }

    this._onResponse()
  }

  _onResponse() {
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
