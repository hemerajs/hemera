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
 * - Restore context
 * - Tracing
 * - Check for max recusion error
 * - Build request message
 *
 * @param {*} context
 * @param {*} next
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
    type: pattern.pubsub$ === true ? 'pubsub' : 'request'
  }

  if (context._config.logTraceDetails) {
    context.log = context.log.child({
      requestId: request.id,
      parentSpanId: context.trace$.parentSpanId,
      traceId: context.trace$.traceId,
      spanId: context.trace$.spanId
    })
    context.log.info(
      {
        pattern: context.trace$.method
      },
      'incoming request'
    )
  } else {
    context.log.info(
      {
        requestId: request.id,
        pattern: context.trace$.method
      },
      'incoming request'
    )
  }

  // build msg
  let message = {
    pattern: cleanPattern,
    meta: context.meta$,
    delegate: context.delegate$,
    trace: context.trace$,
    request
  }

  context._message = message

  context.emit('clientPreRequest', context)

  next()
}

/**
 * - Restore context
 * - Measure request duration
 *
 * @param {*} context
 * @param {*} next
 */
function onClientPostRequest(context, next) {
  let pattern = context._pattern
  let msg = context.response.payload

  // pass to act context
  if (msg) {
    context.request$ = msg.request || {}
    context.trace$ = msg.trace || {}
    context.meta$ = msg.meta || {}
  }

  // calculate request duration
  const now = Util.nowHrTime()
  const diff = now - context.trace$.timestamp
  context.trace$.duration = diff

  context.request$.service = pattern.topic
  context.request$.method = context.trace$.method

  if (context._config.logTraceDetails) {
    context.log = context.log.child({
      requestId: context.request$.id,
      parentSpanId: context.trace$.parentSpanId,
      traceId: context.trace$.traceId,
      spanId: context.trace$.spanId
    })
    context.log.info(
      {
        pattern: context.trace$.method,
        responseTime: context.trace$.duration
      },
      'request completed'
    )
  } else {
    context.log.info(
      {
        requestId: context.request$.id,
        pattern: context.trace$.method,
        responseTime: context.trace$.duration
      },
      'request completed'
    )
  }

  context.emit('clientPostRequest', context)

  next()
}

/**
 * - Restore context
 * - Resolve pattern
 * - Clean pattern when maxMessages$ was used
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
function onServerPreRequest(context, req, res, next) {
  let m = context._serverDecoder(context.request.payload)

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

  context.request.payload = m.value
  context.request.error = null

  // incoming pattern
  context._pattern = context.request.payload.pattern
  // find matched action
  context.matchedAction = context._router.lookup(context._pattern)
  // remove pattern when maxMessages$ was received
  // only relevant for server actions with custom transport options
  if (context.matchedAction) {
    context.matchedAction._receivedMsg++
    if (
      context.matchedAction._receivedMsg ===
      context.matchedAction.transport.maxMessages
    ) {
      // we only need remove pattern the subscription is unsubscribed by nats driver
      context.cleanTopic(context._topic)
    }
  } else if (context._notFoundPattern) {
    // fallback to notFound action when defined
    context.matchedAction = context._router.lookup(context._notFoundPattern)
  }
  context.emit('serverPreRequest', context)

  next()
}

/**
 * Only validate when:
 * - no error was set before
 * - pattern could be resolved
 * - schemaCompiler was found
 * @param {*} context
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function onServerPreRequestSchemaValidation(context, req, res, next) {
  if (context.matchedAction && context._schemaCompiler) {
    const schema = context.matchedAction.schema
    const ret = context._schemaCompiler(schema)(req.payload.pattern)
    if (ret) {
      // promise
      if (typeof ret.then === 'function') {
        // avoid to create a seperate promise
        // eslint-disable-next-line promise/catch-or-return
        ret.then(modifiedPattern => {
          if (modifiedPattern) {
            req.payload.pattern = modifiedPattern
          }
          next()
        }, next)
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
 * Only validate when:
 * - no error was set before
 * - pattern could be resolved
 * - schemaCompiler was found
 *
 * @param {*} context
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function onServerPreResponseSchemaValidation(context, req, res, next) {
  if (!res.error && context.matchedAction && context._responseSchemaCompiler) {
    const schema = context.matchedAction.schema
    const ret = context._responseSchemaCompiler(schema)(res.payload)
    if (ret) {
      // promise
      if (typeof ret.then === 'function') {
        // avoid to create a seperate promise
        // eslint-disable-next-line promise/catch-or-return
        ret.then(
          modifiedPayload => {
            if (modifiedPayload) {
              res.payload = modifiedPayload
            }
            next()
          },
          err => {
            res.error = err
            next(err)
          }
        )
        return
      } else if (ret.error) {
        res.error = ret.error
        next(ret.error)
        return
      } else if (ret.value) {
        res.payload = ret.value
        next()
        return
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
module.exports.onServerPreResponse = [onServerPreResponseSchemaValidation]
module.exports.onServerPreRequest = [
  onServerPreRequest,
  onServerPreRequestSchemaValidation,
  onServerPreRequestLoadTest
]
