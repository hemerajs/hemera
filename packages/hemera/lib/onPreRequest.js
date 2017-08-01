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
 * Is called before the client has send the request to NATS
 *
 * @param {any} ctx
 * @param {any} err
 */
function onPreRequestHandler (ctx, err) {
  let m = ctx._encoderPipeline.run(ctx._message, ctx)

  // encoding issue
  if (m.error) {
    let error = new Errors.ParseError(Constants.PAYLOAD_PARSING_ERROR).causedBy(m.error)
    ctx.log.error(error)
    ctx.emit('clientResponseError', error)

    ctx._execute(error)
    return
  }

  if (err) {
    let error = null
    if (err instanceof SuperError) {
      error = err.rootCause || err.cause || err
    } else {
      error = err
    }
    const internalError = new Errors.HemeraError(Constants.EXTENSION_ERROR).causedBy(err)
    ctx.log.error(internalError)
    ctx.emit('clientResponseError', error)
    ctx._execute(error)
    return
  }

  ctx._request.payload = m.value
  ctx._request.error = m.error

  // use simple publish mechanism instead of request/reply
  if (ctx._pattern.pubsub$ === true) {
    if (ctx._actCallback) {
      ctx.log.info(Constants.PUB_CALLBACK_REDUNDANT)
    }

    ctx._transport.send(ctx._pattern.topic, ctx._request.payload)
  } else {
    const optOptions = {}
    // limit on the number of responses the requestor may receive
    if (ctx._pattern.maxMessages$ > 0) {
      optOptions.max = ctx._pattern.maxMessages$
    } else if (ctx._pattern.maxMessages$ !== -1) {
      optOptions.max = 1
    }
    // send request
    ctx._sid = ctx._transport.sendRequest(ctx._pattern.topic, ctx._request.payload, optOptions, ctx._sendRequestHandler.bind(ctx))

    // handle timeout
    ctx.handleTimeout()
  }
}

module.exports = onPreRequestHandler
