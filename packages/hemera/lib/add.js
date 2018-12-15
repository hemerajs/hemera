'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const { extRunner } = require('./extensionRunner')
const { sAddReceivedMsg } = require('./symbols')

class Add {
  constructor(addDef) {
    this.sid = 0
    this.middleware = addDef.middleware || []
    this.pattern = addDef.pattern
    this.schema = addDef.schema
    this.transport = addDef.transport
    this.action = null
    // only used for maxMessages$ flag
    this[sAddReceivedMsg] = 0
  }

  _use(handler) {
    this.middleware.push(handler)
  }

  use(handler) {
    if (Array.isArray(handler)) {
      handler.forEach(h => this._use(h))
    } else {
      this._use(handler)
    }

    return this
  }

  end(cb) {
    this.action = cb
  }

  run(request, response, cb) {
    extRunner(
      this.middleware,
      (fn, state, next) => fn(request, response, next),
      null,
      cb
    )
  }
}

module.exports = Add
