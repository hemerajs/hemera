/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Util = require('./util'),
  Hoek = require('hoek')

/**
 * 
 * 
 * @class ActContext
 */
class ActContext {

  /**
   * 
   * 
   * @static
   * @param {any} pattern
   * @param {any} cleanPattern
   * @param {any} ctx
   * @param {any} prevCtx
   * 
   * @memberOf ActContext
   */
  static onPreRequest(pattern, cleanPattern, ctx, prevCtx) {

      //Shared context
      ctx.context$ = pattern.context$ || prevCtx.context$

      //Set metadata by passed pattern or current message context
      ctx.meta$ = Hoek.merge(pattern.meta$ || {}, ctx.meta$)

      //Tracing
      ctx.trace$ = pattern.trace$ || {}
      ctx.trace$.parentSpanId = prevCtx.trace$.spanId
      ctx.trace$.traceId = prevCtx.trace$.traceId || Util.randomId()
      ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : Util.randomId()
      ctx.trace$.timestamp = Util.nowHrTime()
      ctx.trace$.service = pattern.topic
      ctx.trace$.method = Util.pattern(pattern)

      //Request
      let request = {}
      request.id = pattern.requestId$ || Util.randomId()
      request.parentId = ctx.request$.id
      request.timestamp = Util.nowHrTime()

      //Build msg
      let message = {
        pattern: cleanPattern,
        meta$: ctx.meta$,
        trace$: ctx.trace$,
        request$: request
      }

      ctx.message = message

      ctx.log.info(pattern, `ACT_OUTBOUND - ID:${ctx.message.request$.id}`)

      ctx.emit('onPreRequest', ctx)
    }
    /**
     * 
     * 
     * @static
     * @param {any} ctx
     * @param {any} msg
     * 
     * @memberOf ActContext
     */
  static onPostRequest(ctx, msg, pattern) {

    //Pass to act context
    ctx.request$ = msg.request$ || {}
    ctx.request$.service = pattern.topic
    ctx.request$.method = Util.pattern(pattern)
    ctx.trace$ = msg.trace$ || {}
    ctx.meta$ = msg.meta$ || {}

    ctx.log.info(`ACT_INBOUND - ID:${ctx.request$.id} (${ctx.request$.duration / 1000000}ms)`)

    ctx.emit('onPostRequest', ctx)
  }

}

module.exports = ActContext