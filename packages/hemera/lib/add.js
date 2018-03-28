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
  /**
   * Creates an instance of Add.
   * @param {any} addDef
   *
   * @memberOf Add
   */
  constructor(addDef, options) {
    this.actMeta = addDef
    this.options = options
    this.actMeta.middleware = addDef.middleware || []
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberof Add
   */
  _use(handler) {
    this.actMeta.middleware.push(handler)
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

  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get middleware() {
    return this.actMeta.middleware
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get schema() {
    return this.actMeta.schema
  }

  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get pattern() {
    return this.actMeta.pattern
  }

  /**
   *
   *
   *
   * @memberOf Add
   */
  set action(action) {
    this.actMeta.action = action
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get action() {
    return this.actMeta.action
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get plugin() {
    return this.actMeta.plugin
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get transport() {
    return this.actMeta.transport
  }
}

module.exports = Add
