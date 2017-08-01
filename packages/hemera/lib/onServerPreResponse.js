'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SuperError = require('super-error')
const Constants = require('./constants')
const Errors = require('./errors')

/**
 * Is called before the server has replied and build the message
 *
 * @param {any} ctx
 * @param {any} err
 * @param {any} value
 * @returns
 */
function onServerPreResponseHandler (ctx, err, value) {
  // check if an error was already wrapped
  if (ctx._response.error) {
    ctx.emit('serverResponseError', ctx._response.error)
    ctx.log.error(ctx._response.error)
  } else if (err) { // check for an extension error
    if (err instanceof SuperError) {
      ctx._response.error = err.rootCause || err.cause || err
    } else {
      ctx._response.error = err
    }

    const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, ctx.errorDetails).causedBy(err)
    ctx.log.error(internalError)
    ctx.emit('serverResponseError', ctx._response.error)
  }

  // reply value from extension
  if (value) {
    ctx._response.payload = value
  }

  // create message payload
  ctx._buildMessage()

  // indicates that an error occurs and that the program should exit
  if (ctx._shouldCrash) {
    // only when we have an inbox othwerwise exit the service immediately
    if (ctx._replyTo) {
      // send error back to callee
      return ctx._transport.send(ctx._replyTo, ctx._message, () => {
        // let it crash
        if (ctx._config.crashOnFatal) {
          ctx.fatal()
        }
      })
    } else if (ctx._config.crashOnFatal) {
      return ctx.fatal()
    }
  }

  // reply only when we have an inbox
  if (ctx._replyTo) {
    return ctx._transport.send(ctx._replyTo, ctx._message)
  }
}

module.exports = onServerPreResponseHandler
