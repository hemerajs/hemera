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
const {
  responseExtIterator,
  serverExtIterator,
  serverOnErrorIterator
} = require('./extensionRunner')
const {
  sReplySent,
  sReplyRequest,
  sReplyResponse,
  sReplyHemera,
  sReplyIsRunningOnErrorHook
} = require('./symbols')

class Reply {
  constructor(request, response, hemera, logger) {
    this[sReplyRequest] = request
    this[sReplyResponse] = response
    this[sReplyHemera] = hemera
    this.log = logger
    this[sReplySent] = false
    this[sReplyIsRunningOnErrorHook] = false
    this.isError = false
  }

  set payload(value) {
    this[sReplyResponse].payload = value
  }

  get payload() {
    return this[sReplyResponse].payload
  }

  set error(value) {
    this[sReplyResponse].error = this[sReplyHemera]._attachHops(
      this[sReplyHemera].getRootError(value)
    )
  }

  get error() {
    return this[sReplyResponse].error
  }

  next(msg) {
    this[sReplySent] = false
    this.send(msg)
  }

  send(msg) {
    if (this[sReplyIsRunningOnErrorHook] === true) {
      throw new Error('You cannot use `send` inside the `onError` hook')
    }

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
      const result = this[sReplyHemera]._errorHandler(
        this[sReplyHemera],
        err,
        this.reply
      )
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
              this[sReplyHemera].errorDetails
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

  _onErrorHook() {
    if (this[sReplyHemera]._extensionManager.onError.length) {
      this[sReplyIsRunningOnErrorHook] = true
      runExt(
        this[sReplyHemera]._extensionManager.onError,
        serverOnErrorIterator,
        this[sReplyHemera],
        _ => this._sendHook()
      )
      return
    }

    this._sendHook()
  }

  _sendHook() {
    if (this[sReplyHemera]._extensionManager.onSend.length) {
      runExt(
        this[sReplyHemera]._extensionManager.onSend,
        serverExtIterator,
        this[sReplyHemera],
        err => this._sendHookCallback(err)
      )
    } else {
      this._sendHookCallback()
    }
  }

  _sendHookCallback(extensionError) {
    if (extensionError) {
      const internalError = new Errors.HemeraError(
        'onSend extension',
        this[sReplyHemera].errorDetails
      ).causedBy(extensionError)
      this.log.error(internalError)

      // first set error has precedence
      if (this.error === null) {
        this[sReplySent] = false
        this.send(extensionError)
        return
      }
    }

    this._send()
  }

  _send() {
    let msg = this.build(
      this[sReplyHemera].meta$,
      this[sReplyHemera].trace$,
      this[sReplyHemera].request$
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

    if (this[sReplyResponse].replyTo) {
      this[sReplyHemera]._transport.send(
        this[sReplyResponse].replyTo,
        msg.value
      )
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
            let internalError = new Errors.ParseError(
              'onResponse extension'
            ).causedBy(err)
            this.log.error(internalError)
            this._handleError(err)
          }
        }
      )
    }
  }

  build(meta$, trace$, request$) {
    let message = {
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
