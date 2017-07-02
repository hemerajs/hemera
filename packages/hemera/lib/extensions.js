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
function onClientPreRequest (next) {
  let ctx = this

  let pattern = this._pattern

  let prevCtx = this._prevContext
  let cleanPattern = this._cleanPattern
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
  if (this._config.maxRecursion > 1) {
    const callSignature = `${ctx.trace$.traceId}:${ctx.trace$.method}`
    if (ctx.meta$ && ctx.meta$.referrers) {
      let count = ctx.meta$.referrers[callSignature]
      count += 1
      ctx.meta$.referrers[callSignature] = count
      if (count > this._config.maxRecursion) {
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
    timestamp: currentTime,
    type: pattern.pubsub$ === true ? Constants.REQUEST_TYPE_PUBSUB : Constants.REQUEST_TYPE_REQUEST,
    duration: 0
  }

  ctx.emit('clientPreRequest')

  // build msg
  let message = {
    pattern: cleanPattern,
    meta: ctx.meta$,
    delegate: ctx.delegate$,
    trace: ctx.trace$,
    request: request
  }

  ctx._message = message

  ctx.log.info({
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
function onClientPreRequestCircuitBreaker (next) {
  let ctx = this

  if (ctx._config.circuitBreaker.enabled) {
    const circuitBreaker = ctx._circuitBreakerMap.get(ctx.trace$.method)
    if (!circuitBreaker) {
      this._circuitBreakerMap.set(ctx.trace$.method, new CircuitBreaker(ctx._config.circuitBreaker))
    } else {
      if (!circuitBreaker.available()) {
        // trigger half-open timer
        circuitBreaker.failure()
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
function onClientPostRequest (next) {
  let ctx = this
  let pattern = this._pattern
  let msg = ctx._response.payload

  // pass to act context
  if (msg) {
    ctx.request$ = msg.request || {}
    ctx.trace$ = msg.trace || {}
    ctx.meta$ = msg.meta || {}
  }

  ctx.request$.service = pattern.topic
  ctx.request$.method = ctx.trace$.method

  ctx.log.info({
    inbound: ctx
  })

  ctx.emit('clientPostRequest')

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
function onServerPreRequest (req, res, next) {
  let ctx = this

  let m = ctx._decoder.decode.call(ctx, ctx._request.payload)

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

  ctx.emit('serverPreRequest')

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
function onServerPreRequestLoadTest (req, res, next) {
  let ctx = this

  if (ctx._config.load.checkPolicy) {
    const error = this._loadPolicy.check()
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
function onServerPreHandler (req, res, next) {
  let ctx = this

  ctx.emit('serverPreHandler')

  next()
}

function onServerPreResponse (req, res, next) {
  let ctx = this

  ctx.emit('serverPreResponse')

  next()
}

module.exports.onClientPreRequest = [onClientPreRequest, onClientPreRequestCircuitBreaker]
module.exports.onClientPostRequest = [onClientPostRequest]
module.exports.onServerPreRequest = [onServerPreRequest, onServerPreRequestLoadTest]
module.exports.onServerPreHandler = [onServerPreHandler]
module.exports.onServerPreResponse = [onServerPreResponse]
