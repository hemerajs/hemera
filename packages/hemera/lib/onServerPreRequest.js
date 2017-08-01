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
const onServerPreHandler = require('./onServerPreHandler')

function onServerPreRequest (ctx, err, value) {
  if (err) {
    if (err instanceof SuperError) {
      ctx._response.error = err.rootCause || err.cause || err
    } else {
      ctx._response.error = err
    }

    ctx.finish()
    return
  }

  // reply value from extension
  if (value) {
    ctx._response.payload = value
    ctx.finish()
    return
  }

  // check if a handler is registered with this pattern
  if (ctx._actMeta) {
    ctx._extensions.onServerPreHandler.dispatch(ctx, (err, val) => onServerPreHandler(ctx, err, val))
  } else {
    const internalError = new Errors.PatternNotFound(Constants.PATTERN_NOT_FOUND, ctx.errorDetails)
    ctx.log.error(internalError)
    ctx._response.error = internalError

    // send error back to callee
    ctx.finish()
  }
}

module.exports = onServerPreRequest
