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
const CircuitBreaker = require('./circuitBreaker')

/**
 *
 *
 * @param {any} next
 * @returns
 */
function onClientPreRequest (ctx, next) {
  let pattern = ctx._pattern

  let prevCtx = ctx._prevContext
  let cleanPattern = ctx._cleanPattern
  let currentTime = Util.nowHrTime()

  // shared context
  ctx.context$ = pattern.context$ || prevCtx.context$

  // set metadata by passed pattern or current message context
  ctx.meta$ = Object.assign(pattern.meta$ || {}, ctx.meta$)
  // is only passed by msg
  ctx.delegate$ = pattern.delegate$ || {}

  // tracing
  ctx.trace$ = pattern.trace$ || {}
  ctx.trace$.parentSpanId = ctx.trace$.spanId || prevCtx.trace$.spanId
  ctx.trace$.traceId = ctx.trace$.traceId || prevCtx.trace$.traceId || Util.randomId()
  ctx.trace$.spanId = Util.randomId()
  ctx.trace$.timestamp = currentTime
  ctx.trace$.service = pattern.topic
  ctx.trace$.method = Util.pattern(pattern)

  // detect recursion
  if (ctx._config.maxRecursion > 1) {
    const callSignature = `${ctx.trace$.traceId}:${ctx.trace$.method}`
    if (ctx.meta$ && ctx.meta$.referrers) {
      var count = ctx.meta$.referrers[callSignature]
      count += 1
      ctx.meta$.referrers[callSignature] = count
      if (count > ctx._config.maxRecursion) {
        ctx.meta$.referrers = null
        return next(new Errors.MaxRecursionError({
          count: --count
        }))
      }
    } else {
      ctx.meta$.referrers = {}
      ctx.meta$.referrers[callSignature] = 1
    }
  }

  // request
  let request = {
    id: pattern.requestId$ || Util.randomId(),
    parentId: ctx.request$.id || pattern.requestParentId$,
    type: pattern.pubsub$ === true ? Constants.REQUEST_TYPE_PUBSUB : Constants.REQUEST_TYPE_REQUEST
  }

  ctx.emit('clientPreRequest', ctx)

  // build msg
  let message = {
    pattern: cleanPattern,
    meta: ctx.meta$,
    delegate: ctx.delegate$,
    trace: ctx.trace$,
    request: request
  }

  ctx._message = message

  ctx.log.debug({
    outbound: ctx
  })

  next()
}

/**
 *
 *
 * @param {any} next
 * @returns
 */
function onClientPreRequestCircuitBreaker (ctx, next) {
  if (ctx._config.circuitBreaker.enabled) {
    // any pattern represent an own circuit breaker
    const circuitBreaker = ctx._circuitBreakerMap.get(ctx.trace$.method)
    if (!circuitBreaker) {
      const cb = new CircuitBreaker(ctx._config.circuitBreaker)
      ctx._circuitBreakerMap.set(ctx.trace$.method, cb)
    } else {
      if (!circuitBreaker.available()) {
        // trigger half-open timer
        circuitBreaker.record()
        return next(new Errors.CircuitBreakerError(`Circuit breaker is ${circuitBreaker.state}`, { state: circuitBreaker.state, method: ctx.trace$.method, service: ctx.trace$.service }))
      }
    }

    next()
  } else {
    next()
  }
}

/**
 *
 *
 * @param {any} next
 */
function onClientPostRequest (ctx, next) {
  let pattern = ctx._pattern
  let msg = ctx._response.payload

  // pass to act context
  if (msg) {
    ctx.request$ = msg.request || {}
    ctx.trace$ = msg.trace || {}
    ctx.meta$ = msg.meta || {}
  }

  // calculate request duration
  let diff = Util.nowHrTime() - ctx.trace$.timestamp
  ctx.trace$.duration = diff

  ctx.request$.service = pattern.topic
  ctx.request$.method = ctx.trace$.method

  ctx.log.debug({
    inbound: ctx
  })

  ctx.emit('clientPostRequest', ctx)

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
function onServerPreRequest (ctx, req, res, next) {
  let m = ctx._decoderPipeline.run(ctx._request.payload, ctx)

  if (m.error) {
    return res.send(m.error)
  }

  let msg = m.value

  if (msg) {
    ctx.meta$ = msg.meta || {}
    ctx.trace$ = msg.trace || {}
    ctx.delegate$ = msg.delegate || {}
    ctx.request$ = msg.request || {}
    ctx.auth$ = {}
  }

  ctx._request.payload = m.value
  ctx._request.error = m.error

  // icnoming pattern
  ctx._pattern = ctx._request.payload.pattern
  // find matched route
  ctx._actMeta = ctx._router.lookup(ctx._pattern)

  ctx.emit('serverPreRequest', ctx)

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
function onServerPreRequestLoadTest (ctx, req, res, next) {
  if (ctx._config.load.checkPolicy) {
    const error = ctx._loadPolicy.check()
    if (error) {
      ctx._shouldCrash = ctx._config.load.shouldCrash
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
function onServerPreHandler (ctx, req, res, next) {
  ctx.emit('serverPreHandler', ctx)

  next()
}

function onServerPreResponse (ctx, req, res, next) {
  ctx.emit('serverPreResponse', ctx)

  next()
}

module.exports.onClientPreRequest = [onClientPreRequest, onClientPreRequestCircuitBreaker]
module.exports.onClientPostRequest = [onClientPostRequest]
module.exports.onServerPreRequest = [onServerPreRequest, onServerPreRequestLoadTest]
module.exports.onServerPreHandler = [onServerPreHandler]
module.exports.onServerPreResponse = [onServerPreResponse]
