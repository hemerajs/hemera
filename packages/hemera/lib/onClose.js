'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Constants = require('./constants')
const _ = require('lodash')

/**
 * Is called after all onClose extensions have been called
 *
 * @param {any} ctx
 * @param {any} err
 * @param {any} val
 * @param {any} cb
 */
function onClose (ctx, err, val, cb) {
  // remove all active subscriptions
  ctx.removeAll()

  // Waiting before all queued messages was proceed
  // and then close hemera and nats
  ctx._transport.flush(() => {
    ctx._heavy.stop()
    // Does not throw an issue when connection is not available
    ctx._transport.close()

    if (err) {
      ctx.log.error(err)
      ctx.emit('error', err)
      if (_.isFunction(cb)) {
        cb(err)
      }
    } else {
      if (_.isFunction(cb)) {
        cb(null, val)
      }
    }
  })
}

module.exports = onClose
