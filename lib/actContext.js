/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Util = require('./util')

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
  static init() {}
    /**
     * 
     * 
     * @static
     * @param {any} ctx
     * @param {any} msg
     * 
     * @memberOf ActContext
     */
  static after(ctx, msg, pattern) {

      //Check if request$ was successfully transfered
      //Can fail when message is not returned
      if (!msg.request$) {

        msg.request$ = {}
        msg.request$.pattern = Util.pattern(pattern)
        msg.request$.endTime = Util.nowHrTime()
        msg.request$.transportLatency = msg.response$.startTime - msg.request$.startTime
        msg.request$.duration = msg.request$.endTime - msg.request$.startTime
      } else {

        msg.request$.endTime = Util.nowHrTime()
        msg.request$.pattern = Util.pattern(pattern)
        msg.request$.transportLatency = msg.response$.startTime - msg.request$.startTime
        msg.request$.duration = msg.request$.endTime - msg.request$.startTime
      }

      //Pass request to act context
      ctx.request$ = msg.request$

    }
    /**
     * 
     * 
     * @static
     * @param {any} pattern
     * @param {any} ctx
     * @param {any} prevCtx
     * 
     * @memberOf ActContext
     */
  static before(pattern, ctx, prevCtx) {

    //Set context by pattern or current context$
    ctx.context$ = pattern.context$ || prevCtx.context$

    //Set metadata by passed pattern or previous context
    ctx.meta$ = (pattern.meta$ || ctx.meta$) || {}
    ctx.meta$.span = ctx.meta$.span ? ++ctx.meta$.span : 1
    ctx.meta$.traceId = ctx.meta$.traceId || Util.createUniqueId()
    
    //Expose to current act handler
    ctx.parentId$ = ctx.requestId$;
    ctx.requestId$ = pattern.requestId$ || Util.createUniqueId()
  }

}

module.exports = ActContext