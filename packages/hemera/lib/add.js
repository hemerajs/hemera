'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const runExt = require('./extensionRunner').extRunner

/**
 *
 *
 * @export
 * @class Add
 */
class Add {
  constructor(addDef) {
    this.sid = 0
    this.middleware = addDef.middleware || []
    this.pattern = addDef.pattern
    this.schema = addDef.schema
    this.transport = addDef.transport
    this.action = null
    // only used for maxMessages$ flag
    this._receivedMsg = 0
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberof Add
   */
  _use(handler) {
    this.middleware.push(handler)
  }

  /**
   *
   *
   * @param {any} handler
   * @returns
   *
   * @memberOf Add
   */
  use(handler) {
    if (Array.isArray(handler)) {
      handler.forEach(h => this._use(h))
    } else {
      this._use(handler)
    }

    return this
  }

  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Add
   */
  end(cb) {
    this.action = cb
  }

  /**
   *
   *
   * @param {any} request
   * @param {any} response
   * @param {any} cb
   *
   * @memberof Add
   */
  run(request, response, cb) {
    runExt(
      this.middleware,
      (fn, state, next) => fn(request, response, next),
      null,
      cb
    )
  }
}

module.exports = Add
