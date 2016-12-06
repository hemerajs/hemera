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
 * @class AddContext
 */
class AddContext {

  /**
   * 
   * 
   * @static
   * @param {any} ctx
   * 
   * @memberOf AddContext
   */
  static start(ctx) {}
    /**
     * 
     * 
     * @static
     * @param {any} ctx
     * @param {any} msg
     * 
     * @memberOf AddContext
     */
  static onPreRequest(ctx, msg) {

      let result = msg.pattern

      ctx.meta$ = msg.meta$ || {}
      ctx.trace$ = msg.trace$ || {}
      ctx.request$ = msg.request$ || {}

      return result
    }
    /**
     * 
     * 
     * @static
     * @param {any} ctx
     * @param {any} msg
     * 
     * @memberOf AddContext
     */
  static OnPreResponse(ctx, result) {

    let message = {}
    message.meta$ = ctx.meta$ || {}
    message.trace$ = ctx.trace$ || {}
    message.request$ = ctx.request$
    message.result = result

    let endTime = Util.nowHrTime()
    message.request$.duration = endTime - message.request$.timestamp
    message.trace$.duration = endTime - message.request$.timestamp

    ctx.message = message

  }

}

module.exports = AddContext