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

function onServerPreHandler (ctx, err, value) {
  if (err) {
    if (err instanceof SuperError) {
      ctx._response.error = err.rootCause || err.cause || err
    } else {
      ctx._response.error = err
    }

    const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR, ctx.errorDetails).causedBy(err)
    ctx.log.error(internalError)

    ctx.finish()
    return
  }

  // reply value from extension
  if (value) {
    ctx._response.payload = value
    ctx.finish()
    return
  }

  try {
    let action = ctx._actMeta.action.bind(ctx)

    ctx._actMeta.dispatch(ctx._request, ctx._response, (err) => {
      // middleware error
      if (err) {
        if (err instanceof SuperError) {
          ctx._response.error = err.rootCause || err.cause || err
        } else {
          ctx._response.error = err
        }

        const internalError = new Errors.HemeraError(Constants.ADD_MIDDLEWARE_ERROR, ctx.errorDetails).causedBy(err)
        ctx.log.error(internalError)

        ctx.finish()
        return
      }

      // if request type is 'pubsub' we dont have to reply back
      if (ctx._request.payload.request.type === Constants.REQUEST_TYPE_PUBSUB) {
        action(ctx._request.payload.pattern)
        ctx.finish()
        return
      }
      // execute RPC action
      if (ctx._actMeta.isPromisable) {
        action(ctx._request.payload.pattern)
          .then(x => ctx._actionHandler(null, x))
          .catch(e => ctx._actionHandler(e))
      } else {
        action(ctx._request.payload.pattern, ctx._actionHandler.bind(ctx))
      }
    })
  } catch (err) {
    if (err instanceof SuperError) {
      ctx._response.error = err.rootCause || err.cause || err
    } else {
      ctx._response.error = err
    }

    // service should exit
    ctx._shouldCrash = true

    ctx.finish()
  }
}

module.exports = onServerPreHandler
