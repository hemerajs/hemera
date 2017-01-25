// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Util from './util'
import Hoek from 'hoek'

module.exports.onClientPreRequest = [function onClientPreRequest(next: Function) {

  let ctx: Hemera = this

  let pattern: Pattern = this._pattern

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
  let request: Request = {
    id: pattern.requestId$ || Util.randomId(),
    parentId: ctx.request$.id,
    timestamp: currentTime,
    type: pattern.pubsub$ === true ? 'pubsub' : 'request',
    duration: 0
  }

  // build msg
  let message: ActMessage = {
    pattern: cleanPattern,
    meta: ctx.meta$,
    delegate: ctx.delegate$,
    trace: ctx.trace$,
    request: request
  }

  ctx._message = message

  let m = ctx._encoder.encode.call(ctx, ctx._message)

  // throw encoding issue
  if (m.error) {

    return next(m.error)
  }

  ctx._request = m.value

  ctx.log.info(pattern, `ACT_OUTBOUND - ID:${String(ctx._message.request.id)}`)

  ctx.emit('onClientPreRequest', ctx)

  next()
}]

module.exports.onClientPostRequest = [function onClientPostRequest(next: Function) {

  let ctx: Hemera = this
  let pattern: Pattern = this._pattern
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

module.exports.onServerPreRequest = [function onServerPreRequest(next: Function) {

  let ctx: Hemera = this

  let m = ctx._decoder.decode.call(ctx, ctx._request)

  if(m.error) {

    return next(m.error)
  }

  let msg = m.value

  if (msg) {

    ctx.meta$ = msg.meta || {}
    ctx.trace$ = msg.trace || {}
    ctx.delegate$ = msg.delegate || {}
    ctx.request$ = msg.request || {}
  }

  ctx._request = m

  ctx.emit('onServerPreRequest', ctx)

  next()
}]

module.exports.onServerPreHandler = [function onServerPreHandler(next: Function) {

  let ctx: Hemera = this

  ctx.emit('onServerPreHandler', ctx)

  next()

}]

module.exports.onServerPreResponse = [function onServerPreResponse(next: Function) {

  let ctx: Hemera = this

  ctx.emit('onServerPreResponse', ctx)

  next()

}]
