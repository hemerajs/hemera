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
const { sAddReceivedMsg } = require('./symbols')

/**
 * - Restore context
 * - Tracing
 * - Check for recusion error
 * - Build request message
 *
 * @param {*} context
 * @param {*} next
 */
function onAct(context, next) {
  const pattern = context._pattern

  const parentContext = context._parentContext
  const cleanPattern = context._cleanPattern
  const currentTime = Util.nowHrTime()

  // shared context
  context.context$ = pattern.context$ || parentContext.context$

  // set metadata by passed pattern or current message context
  Object.assign(context.meta$, pattern.meta$)
  // is only passed by msg
  context.delegate$ = pattern.delegate$ || {}

  // tracing
  if (pattern.trace$) {
    context.trace$ = {
      spanId: pattern.trace$.spanId || context._idGenerator(),
      traceId: pattern.trace$.traceId || context._idGenerator()
    }
    context.trace$.parentSpanId = pattern.trace$.parentSpanId || parentContext.trace$.spanId
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
      let count = context.meta$.referrers[callSignature]
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
  context.request$ = {
    id: pattern.requestId$ || context._idGenerator(),
    type: pattern.pubsub$ === true ? 'pubsub' : 'request',
    service: pattern.topic,
    method: context.trace$.method
  }

  if (context._config.traceLog === true) {
    context.log = context.log.child({
      tag: context._config.tag,
      requestId: context.request$.id,
      parentSpanId: context.trace$.parentSpanId,
      traceId: context.trace$.traceId,
      spanId: context.trace$.spanId
    })
    context.log.info(
      {
        pattern: context.trace$.method
      },
      'Request started'
    )
  } else {
    context.log.info(
      {
        requestId: context.request$.id,
        pattern: context.trace$.method
      },
      'Request started'
    )
  }

  // build msg
  const message = {
    pattern: cleanPattern,
    meta: context.meta$,
    delegate: context.delegate$,
    trace: context.trace$,
    request: context.request$
  }

  context._message = message

  next()
}

/**
 * - Restore context
 * - Measure request duration
 *
 * @param {*} context
 * @param {*} next
 */
function onActFinished(context, next) {
  const msg = context.response.payload

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

  if (context._config.traceLog) {
    context.log = context.log.child({
      tag: context._config.tag,
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
      'Request completed'
    )
  } else {
    context.log.info(
      {
        requestId: context.request$.id,
        pattern: context.trace$.method,
        responseTime: context.trace$.duration
      },
      'Request completed'
    )
  }

  next()
}

/**
 * - Restore context
 * - Resolve pattern
 * - Clean pattern when maxMessages$ was used
 *
 * @param {any} req
 * @param {any} reply
 * @param {any} next
 * @returns
 */
function onRequest(context, req, reply, next) {
  const m = context._serverDecoder(context.request.payload)

  if (m.error) {
    next(m.error)
    return
  }

  const msg = m.value

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

  // We have to remove the pattern manually when maxMessages$ was received.
  // This is required because NATS unsubscribe events is fired too early.
  // Only relevant for server actions with custom transport options.
  if (context.matchedAction !== null) {
    context.matchedAction[sAddReceivedMsg]++
    if (context.matchedAction[sAddReceivedMsg] === context.matchedAction.transport.maxMessages) {
      // we only need to remove the pattern because the subscription is unsubscribed by nats driver automatically
      context.cleanTopic(context._topic)
    }
  } else if (context._notFoundPattern !== null) {
    // fallback to notFound action when defined
    context.matchedAction = context._router.lookup(context._notFoundPattern)
  }

  if (context._config.traceLog === true) {
    context.log = context.log.child({
      tag: context._config.tag,
      requestId: context.request$.id,
      parentSpanId: context.trace$.parentSpanId,
      traceId: context.trace$.traceId,
      spanId: context.trace$.spanId
    })
    context.log.info(
      {
        pattern: context.trace$.method
      },
      'Request received'
    )
  } else {
    context.log.info(
      {
        requestId: context.request$.id,
        pattern: context.trace$.method
      },
      'Request received'
    )
  }

  next()
}

function onSend(context, req, reply, next) {
  if (context._config.traceLog === true) {
    context.log = context.log.child({
      tag: context._config.tag,
      requestId: context.request$.id,
      parentSpanId: context.trace$.parentSpanId,
      traceId: context.trace$.traceId,
      spanId: context.trace$.spanId
    })
    context.log.info(
      {
        pattern: context.trace$.method
      },
      'Request responded'
    )
  } else {
    context.log.info(
      {
        requestId: context.request$.id,
        pattern: context.trace$.method
      },
      'Request responded'
    )
  }
  next()
}

/**
 * Only validate when:
 * - pattern could be resolved
 * - schemaCompiler was found
 * @param {*} context
 * @param {*} req
 * @param {*} reply
 * @param {*} next
 */
function onRequestSchemaValidation(context, req, reply, next) {
  if (context.matchedAction && context._schemaCompiler) {
    const { schema } = context.matchedAction
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
      }
      if (ret.error) {
        return next(ret.error)
      }
      if (ret.value) {
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
 * @param {*} reply
 * @param {*} next
 */
function onSendSchemaValidation(context, req, reply, next) {
  if (!reply.error && context.matchedAction && context._responseSchemaCompiler) {
    const { schema } = context.matchedAction
    const ret = context._responseSchemaCompiler(schema)(reply.payload)
    if (ret) {
      // promise
      if (typeof ret.then === 'function') {
        // avoid to create a seperate promise
        // eslint-disable-next-line promise/catch-or-return
        ret.then(
          modifiedPayload => {
            if (modifiedPayload) {
              reply.payload = modifiedPayload
            }
            next()
          },
          err => {
            reply.error = err
            next(err)
          }
        )
        return
      }
      if (ret.error) {
        reply.error = ret.error
        next(ret.error)
        return
      }
      if (ret.value) {
        reply.payload = ret.value
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
 * @param {any} reply
 * @param {any} next
 * @returns
 */
function onRequestLoadTest(context, req, reply, next) {
  if (context._config.load.checkPolicy === true) {
    try {
      context._heavy.check()
    } catch (error) {
      next(new Errors.ProcessLoadError(error.message, error.data))
      return
    }
  }

  next()
}

module.exports.onAct = [onAct]
module.exports.onActFinished = [onActFinished]
module.exports.onSend = [onSendSchemaValidation, onSend]
module.exports.onRequest = [onRequest, onRequestSchemaValidation, onRequestLoadTest]
