'use strict'

const Util = require('./util')

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function inbound(ctx) {
  return {
    traceId: ctx.trace$.traceId,
    duration: Util.nanoToMsString(ctx.trace$.duration),
    pattern: ctx.request$.method
  }
}

function outbound(ctx) {
  return {
    traceId: ctx.trace$.traceId,
    pattern: ctx.trace$.method
  }
}

module.exports = {
  outbound,
  inbound
}
