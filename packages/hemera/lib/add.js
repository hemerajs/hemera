'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const _ = require('lodash')
const Util = require('./util')

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
    if (_.isArray(handler)) {
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
    Util.eachSeries(
      this.middleware,
      (item, next) => {
        const result = item(request, response, next)
        if (result && typeof result.then === 'function') {
          result.then(x => next(null)).catch(err => next(err))
        } else if (result instanceof Error) {
          next(result)
        } else {
          next(null, result)
        }
      },
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
