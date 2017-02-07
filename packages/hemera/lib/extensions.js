/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Util from './util'
import Hoek from 'hoek'

export const onClientPreRequest = [function onClientPreRequest (next) {
  let ctx = this

  let pattern = this._pattern

  let prevCtx = this._prevContext
  let cleanPattern = this._cleanPattern
  let currentTime = Util.nowHrTime()

  // shared context
  ctx.context$ = pattern.context$ || prevCtx.context$

  // set metadata by passed pattern or current message context
  ctx.meta$ = Hoek.merge(pattern.meta$ || {}, ctx.meta$)
  // is only passed by msg
  ctx.delegate$ = pattern.delegate$ || {}

  // tracing
  ctx.trace$ = pattern.trace$ || {}
  ctx.trace$.parentSpanId = prevCtx.trace$.spanId
  ctx.trace$.traceId = prevCtx.trace$.traceId || Util.randomId()
  ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : Util.randomId()
  ctx.trace$.timestamp = currentTime
  ctx.trace$.service = pattern.topic
  ctx.trace$.method = Util.pattern(pattern)

  // request
  let request = {
    id: pattern.requestId$ || Util.randomId(),
    parentId: ctx.request$.id,
    timestamp: currentTime,
    type: pattern.pubsub$ === true ? 'pubsub' : 'request',
    duration: 0
  }

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

  ctx.emit('onClientPreRequest', ctx)

  next()
}]

export const onClientPostRequest = [function onClientPostRequest (next) {
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
  ctx.request$.method = Util.pattern(pattern)

  ctx.log.info({
    inbound: ctx
  })

  ctx.emit('onClientPostRequest', ctx)

  next()
}]

export const onServerPreRequest = [function onServerPreRequest (req, res, next) {
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
  }

  ctx._request.payload = m.value
  ctx._request.error = m.error

  ctx.emit('onServerPreRequest', ctx)

  next()
}]

export const onServerPreHandler = [function onServerPreHandler (req, res, next) {
  let ctx = this

  ctx.emit('onServerPreHandler', ctx)

  next()
}]

export const onServerPreResponse = [function onServerPreResponse (req, res, next) {
  let ctx = this

  ctx.emit('onServerPreResponse', ctx)

  next()
}]
