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
const Errors = require('./errors')

/**
 *
 *
 * @param {any} next
 * @returns
 */
function onClientPreRequest(context, next) {
  let pattern = context._pattern

  let parentContext = context._parentContext
  let cleanPattern = context._cleanPattern
  let currentTime = Util.nowHrTime()

  // shared context
  context.context$ = pattern.context$ || parentContext.context$

  // set metadata by passed pattern or current message context
  context.meta$ = Object.assign(pattern.meta$ || {}, context.meta$)
  // is only passed by msg
  context.delegate$ = pattern.delegate$ || {}

  // tracing
  if (pattern.trace$) {
    context.trace$ = {
      spanId: pattern.trace$.spanId || context._idGenerator(),
      traceId: pattern.trace$.traceId || context._idGenerator()
    }
    context.trace$.parentSpanId =
      pattern.trace$.parentSpanId || parentContext.trace$.spanId
  } else {
    context.trace$ = {
      spanId: parentContext.trace$.spanId || context._idGenerator(),
      traceId: parentContext.trace$.traceId || context._idGenerator()
    }
    context.trace$.parentSpanId = parentContext.trace$.spanId
  }

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
        return next(
          new Errors.MaxRecursionError({
            count: --count
          })
        )
      }
    } else {
      context.meta$.referrers = {}
      context.meta$.referrers[callSignature] = 1
    }
  }

  // request
  let request = {
    id: pattern.requestId$ || context._idGenerator(),
    parentId: context.request$.id || pattern.requestParentId$,
    type: pattern.pubsub$ === true ? 'pubsub' : 'request'
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
function onClientPostRequest(context, next) {
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
function onServerPreRequest(context, req, res, next) {
  let m = context._serverDecoder(context._request.payload)

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
  context._request.error = null

  // incoming pattern
  context._pattern = context._request.payload.pattern
  // find matched action
  context.matchedAction = context._router.lookup(context._pattern)
  // fallback to notFound action when defined
  if (!context.matchedAction && context._notFoundPattern) {
    context.matchedAction = context._router.lookup(context._notFoundPattern)
  }

  context.emit('serverPreRequest', context)

  next()
}

function onServerPreRequestSchemaValidation(context, req, res, next) {
  if (context.matchedAction && context._schemaCompiler) {
    const schema = context.matchedAction.schema
    const ret = context._schemaCompiler(schema)(req.payload.pattern)
    if (ret) {
      // promise
      if (typeof ret.then === 'function') {
        ret
          .then(modifiedPattern => {
            if (modifiedPattern) {
              req.payload.pattern = modifiedPattern
            }
            next()
          })
          .catch(err => next(err))
        return
      } else if (ret.error) {
        return next(ret.error)
      } else if (ret.value) {
        req.payload.pattern = ret.value
        return next()
      }
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
 * @returns
 */
function onServerPreRequestLoadTest(context, req, res, next) {
  if (context._config.load.checkPolicy) {
    const error = context._loadPolicy.check()
    if (error) {
      return next(new Errors.ProcessLoadError(error.message, error.data))
    }
  }

  next()
}

module.exports.onClientPreRequest = [onClientPreRequest]
module.exports.onClientPostRequest = [onClientPostRequest]
module.exports.onServerPreRequest = [
  onServerPreRequest,
  onServerPreRequestSchemaValidation,
  onServerPreRequestLoadTest
]
