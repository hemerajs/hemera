'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const PrettyMs = require('pretty-ms')

function inbound (ctx) {
  return {
    id: ctx.request$.id,
    duration: PrettyMs(ctx.request$.duration / 1000, { msDecimalDigits: 3 }),
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
