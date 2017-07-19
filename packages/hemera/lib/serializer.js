'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function nanoToMsString (val) {
  return (val / 1e6).toFixed(2) + 'ms'
}

function inbound (ctx) {
  return {
    id: ctx.request$.id,
    duration: nanoToMsString(ctx.trace$.duration),
    pattern: ctx.request$.method
  }
}

function outbound (ctx) {
  return {
    id: ctx._message.request.id,
    pattern: ctx.trace$.method
  }
}

module.exports = {
  outbound,
  inbound
}
