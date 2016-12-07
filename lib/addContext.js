/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Util = require('./util'),
  Errio = require('errio')

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
   * @param {any} msg
   * @returns
   * 
   * @memberOf AddContext
   */
  static OnPreProcessing(ctx, msg) {

    if (msg) {
        
        ctx.meta$ = msg.meta$ || {}
        ctx.trace$ = msg.trace$ || {}
        ctx.request$ = msg.request$ || {}
      }

      ctx.emit('OnPreProcessing', msg)
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
    message.result = result instanceof Error ? null : result
    message.error = result instanceof Error ? Errio.stringify(result) : null

    let endTime = Util.nowHrTime()
    message.request$.duration = endTime - message.request$.timestamp
    message.trace$.duration = endTime - message.request$.timestamp

    ctx.message = message

    ctx.emit('OnPreResponse', message)

  }

}

module.exports = AddContext