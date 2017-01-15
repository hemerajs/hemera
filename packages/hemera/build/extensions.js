// 

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Items = require('items')
const Util = require('./util')
const Hoek = require('hoek')

module.exports.onClientPreRequest = [function onClientPreRequest(next) {

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

  ctx._request = ctx._encoder.encode.call(ctx, ctx._message)

  ctx.log.info(pattern, `ACT_OUTBOUND - ID:${String(ctx._message.request.id)}`)

  ctx.emit('onClientPreRequest', ctx)

  next()
}]

module.exports.onClientPostRequest = [function onClientPostRequest(next) {

  let ctx = this
  let pattern = this._pattern
  let msg = ctx._response.value

  // pass to act context
  ctx.request$ = msg.request || {}
  ctx.request$.service = pattern.topic
  ctx.request$.method = Util.pattern(pattern)
  ctx.trace$ = msg.trace || {}
  ctx.meta$ = msg.meta || {}

  ctx.log.info(`ACT_INBOUND - ID:${ctx.request$.id} (${ctx.request$.duration / 1000000}ms)`)

  ctx.emit('onClientPostRequest', ctx)

  next()
}]

module.exports.onServerPreRequest = [function onServerPreRequest(next) {

  let msg = this._request.value
  let ctx = this

  if (msg) {

    ctx.meta$ = msg.meta || {}
    ctx.trace$ = msg.trace || {}
    ctx.delegate$ = msg.delegate || {}
    ctx.request$ = msg.request || {}
  }

  ctx.emit('onServerPreRequest', ctx)

  next()
}]

module.exports.onServerPreHandler = [function onServerPreHandler(next) {

  let ctx = this

  ctx.emit('onServerPreHandler', ctx)

  next()

}]

module.exports.onServerPreResponse = [function onServerPreResponse(next) {

  let ctx = this

  ctx.emit('onServerPreResponse', ctx)

  next()

}]
