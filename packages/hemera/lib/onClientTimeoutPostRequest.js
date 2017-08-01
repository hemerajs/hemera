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

function onClientTimeoutPostRequestHandler (ctx, err) {
  if (err) {
    let error = null
    if (err instanceof SuperError) {
      error = err.rootCause || err.cause || err
    } else {
      error = err
    }

    const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
    ctx.log.error(internalError)
    ctx._response.error = error
    ctx.emit('clientResponseError', error)
  }

  try {
    ctx._execute(ctx._response.error)
  } catch (err) {
    let error = null
    if (err instanceof SuperError) {
      error = err.rootCause || err.cause || err
    } else {
      error = err
    }

    const internalError = new Errors.FatalError(Constants.FATAL_ERROR, ctx.errorDetails).causedBy(err)
    ctx.log.fatal(internalError)
    ctx.emit('clientResponseError', error)

    // let it crash
    if (ctx._config.crashOnFatal) {
      ctx.fatal()
    }
  }
}

module.exports = onClientTimeoutPostRequestHandler
