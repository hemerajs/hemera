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
   * 
   * @memberOf ActContext
   */
  static start() {}
    /**
     * 
     * 
     * @static
     * @param {any} ctx
     * @param {any} msg
     * 
     * @memberOf ActContext
     */
  static onPreHandler(ctx, msg, pattern) {

      //Pass to act context
      ctx.request$ = msg.request$ || {}
      ctx.request$.pattern = Util.pattern(pattern)
      ctx.trace$ = msg.trace$ || {}
      ctx.trace$.service = Util.pattern(pattern)
      ctx.meta$ = msg.meta$ || {}
    }
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
    ctx.trace$.traceId = prevCtx.trace$.traceId || Util.createUniqueId()
    ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : Util.createUniqueId()
    ctx.trace$.timestamp = Util.nowHrTime()

    //Request
    let request = {}
    request.id = pattern.requestId$ || Util.createUniqueId()
    request.parentId = ctx.request$.id
    request.timestamp = Util.nowHrTime()

    //Build msg
    ctx.msg = {
      pattern: cleanPattern,
      meta$: ctx.meta$,
      trace$: ctx.trace$,
      request$: request
    }
  }

}

module.exports = ActContext