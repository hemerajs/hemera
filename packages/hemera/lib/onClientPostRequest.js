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
const Errio = require('errio')
const Errors = require('./errors')

function onClientPostRequestHandler (ctx, err) {
  // extension error
  if (err) {
    let error = null
    if (err instanceof SuperError) {
      error = err.rootCause || err.cause || err
    } else {
      error = err
    }
    const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, ctx.errorDetails).causedBy(err)
    ctx.log.error(internalError)
    ctx.emit('clientResponseError', error)

    ctx._execute(error)
    return
  }

  if (ctx._response.payload.error) {
    let error = Errio.fromObject(ctx._response.payload.error)

    const internalError = new Errors.BusinessError(Constants.BUSINESS_ERROR, ctx.errorDetails).causedBy(error)
    ctx.log.error(internalError)
    ctx.emit('clientResponseError', error)

    ctx._execute(error)
    return
  }

  ctx._execute(null, ctx._response.payload.result)
}

module.exports = onClientPostRequestHandler
