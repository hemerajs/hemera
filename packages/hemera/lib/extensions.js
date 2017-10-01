'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Util = require('./util')
const Constants = require('./constants')
const Errors = require('./errors')

/**
 *
 *
 * @param {any} next
 * @returns
 */
function onClientPreRequest (context, next) {
  let pattern = context._pattern

  let prevCtx = context._prevContext
  let cleanPattern = context._cleanPattern
  let currentTime = Util.nowHrTime()

  // shared context
  context.context$ = pattern.context$ || prevCtx.context$

  // set metadata by passed pattern or current message context
  context.meta$ = Object.assign(pattern.meta$ || {}, context.meta$)
  // is only passed by msg
  context.delegate$ = pattern.delegate$ || {}

  // tracing
  context.trace$ = pattern.trace$ || {}
  context.trace$.parentSpanId = context.trace$.spanId || prevCtx.trace$.spanId
  context.trace$.traceId = context.trace$.traceId || prevCtx.trace$.traceId || Util.randomId()
  context.trace$.spanId = Util.randomId()
  context.trace$.timestamp = currentTime
  context.trace$.service = pattern.topic
  context.trace$.method = Util.pattern(pattern)

  // detect recursion
  if (context._config.maxRecursion > 1) {
    const callSignature = `${context.trace$.traceId}:${context.trace$.method}`
    if (context.meta$ && context.meta$.referrers) {
      var count = context.meta$.referrers[callSignature]
      count += 1
      context.meta$.referrers[callSignature] = count
      if (count > context._config.maxRecursion) {
        context.meta$.referrers = null
        return next(new Errors.MaxRecursionError({
          count: --count
        }))
      }
    } else {
      context.meta$.referrers = {}
      context.meta$.referrers[callSignature] = 1
    }
  }

  // request
  let request = {
    id: pattern.requestId$ || Util.randomId(),
    parentId: context.request$.id || pattern.requestParentId$,
    type: pattern.pubsub$ === true ? Constants.REQUEST_TYPE_PUBSUB : Constants.REQUEST_TYPE_REQUEST
  }

  context.emit('clientPreRequest', context)

  // build msg
  let message = {
    pattern: cleanPattern,
    meta: context.meta$,
    delegate: context.delegate$,
    trace: context.trace$,
    request: request
  }

  context._message = message

  context.log.debug({
    outbound: context
  })

  next()
}

/**
 *
 *
 * @param {any} next
 */
function onClientPostRequest (context, next) {
  let pattern = context._pattern
  let msg = context._response.payload

  // pass to act context
  if (msg) {
    context.request$ = msg.request || {}
    context.trace$ = msg.trace || {}
    context.meta$ = msg.meta || {}
  }

  // calculate request duration
  let diff = Util.nowHrTime() - context.trace$.timestamp
  context.trace$.duration = diff

  context.request$.service = pattern.topic
  context.request$.method = context.trace$.method

  context.log.debug({
    inbound: context
  })

  context.emit('clientPostRequest', context)

  next()
}

/**
 *
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
function onServerPreRequest (context, req, res, next) {
  let m = context._decoderPipeline.run(context._request.payload, context)

  if (m.error) {
    next(m.error)
    return
  }

  let msg = m.value

  if (msg) {
    context.meta$ = msg.meta || {}
    context.trace$ = msg.trace || {}
    context.delegate$ = msg.delegate || {}
    context.request$ = msg.request || {}
    context.auth$ = {}
  }

  context._request.payload = m.value
  context._request.error = m.error

  // icnoming pattern
  context._pattern = context._request.payload.pattern
  // find matched route
  context._actMeta = context._router.lookup(context._pattern)

  context.emit('serverPreRequest', context)

  next()
}

/**
 *
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
function onServerPreRequestLoadTest (context, req, res, next) {
  if (context._config.load.checkPolicy) {
    const error = context._loadPolicy.check()
    if (error) {
      context._shouldCrash = context._config.load.shouldCrash
      return next(new Errors.ProcessLoadError(error.message, error.data))
    }
  }

  next()
}

/**
 *
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
function onServerPreHandler (context, req, res, next) {
  context.emit('serverPreHandler', context)

  next()
}

function onServerPreResponse (context, req, res, next) {
  context.emit('serverPreResponse', context)

  next()
}

module.exports.onClientPreRequest = [onClientPreRequest]
module.exports.onClientPostRequest = [onClientPostRequest]
module.exports.onServerPreRequest = [onServerPreRequest, onServerPreRequestLoadTest]
module.exports.onServerPreHandler = [onServerPreHandler]
module.exports.onServerPreResponse = [onServerPreResponse]
