'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Errio = require('errio')
const Errors = require('./errors')
const runExt = require('./extensionRunner').extRunner
const { responseExtIterator, serverExtIterator, serverOnErrorIterator } = require('./extensionRunner')
const { sReplySent, sReplyRequest, sReplyResponse, sReplyHemera } = require('./symbols')

class Reply {
  constructor(request, response, hemera, logger) {
    this[sReplyRequest] = request
    this[sReplyResponse] = response
    this[sReplyHemera] = hemera
    this.log = logger
    this[sReplySent] = false
    this.isError = false
  }

  set payload(value) {
    this[sReplyResponse].payload = value
  }

  get payload() {
    return this[sReplyResponse].payload
  }

  set error(value) {
    this[sReplyResponse].error = this[sReplyHemera]._attachHops(this[sReplyHemera].getRootError(value))
  }

  get error() {
    return this[sReplyResponse].error
  }

  next(msg) {
    this[sReplySent] = false
    this.send(msg)
  }

  send(msg) {
    if (this[sReplySent] === true) {
      this.log.warn(new Errors.HemeraError('Reply already sent'))
      return
    }

    this[sReplySent] = true

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
      this._handleError(msg, () => this._onErrorHook())
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

    if (this[sReplyHemera]._errorHandler) {
      const result = this[sReplyHemera]._errorHandler(this[sReplyHemera], err, this.reply)
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            if (cb) {
              cb()
            }
          })
          .catch(err => this._logError(err, 'error handler'))
        return
      }
    }

    if (cb) {
      cb()
    }
  }

  _logError(err, message) {
    const internalError = new Errors.HemeraError(message, this[sReplyHemera].errorDetails).causedBy(err)
    this.log.error(internalError)
  }

  _onErrorHook() {
    if (this[sReplyHemera]._extensionManager.onError.length) {
      runExt(this[sReplyHemera]._extensionManager.onError, serverOnErrorIterator, this[sReplyHemera], err => {
        if (err) {
          this._logError(err, 'onError extension')
        }
        this._sendHook()
      })
      return
    }

    this._sendHook()
  }

  _sendHook() {
    if (this[sReplyHemera]._extensionManager.onSend.length) {
      runExt(this[sReplyHemera]._extensionManager.onSend, serverExtIterator, this[sReplyHemera], err => {
        if (err) {
          this._logError(err, 'onSend extension')

          // first set error has precedence
          if (this.error === null) {
            this[sReplySent] = false
            this.send(err)
            return
          }
        }

        this._send()
      })
      return
    }

    this._send()
  }

  _send() {
    const msg = this.build(this[sReplyHemera].meta$, this[sReplyHemera].trace$, this[sReplyHemera].request$)

    // don't try to send encoding issues back because
    // it could end up in a endloss loop
    if (msg.error) {
      const internalError = new Errors.ParseError('Server encoding').causedBy(msg.error)
      this.log.error(internalError)
      this._handleError(msg.error)
      return
    }

    if (this[sReplyResponse].replyTo) {
      this[sReplyHemera]._transport.send(this[sReplyResponse].replyTo, msg.value)
    }

    this._onResponse()
  }

  _onResponse() {
    if (this[sReplyHemera]._extensionManager.onResponse.length) {
      runExt(
        this[sReplyHemera]._extensionManager.onResponse,
        responseExtIterator,
        this[sReplyHemera],
        err => {
          if (err) {
            this._logError(err, 'onResponse extension')
          }
        }
      )
    }
  }

  build(meta$, trace$, request$) {
    const message = {
      meta: meta$ || {},
      trace: trace$ || {},
      request: request$,
      result: this.error ? null : this.payload,
      error: this.error ? Errio.toObject(this.error) : null
    }

    return this[sReplyHemera]._serverEncoder(message)
  }
}

module.exports = Reply
