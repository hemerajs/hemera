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
const IsGeneratorFn = require('is-generator-function')
const Co = require('co')

/**
 *
 *
 * @export
 * @class Add
 */
class Add {

  /**
   * Creates an instance of Add.
   * @param {any} actMeta
   *
   * @memberOf Add
   */
  constructor (actMeta, options) {
    this.actMeta = actMeta
    this.options = options
    this.actMeta.middleware = actMeta.middleware || []
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberof Add
   */
  _use (handler) {
    if (this.options.generators) {
      if (IsGeneratorFn(handler)) {
        this.actMeta.middleware.push(function () {
        // -1 because (req, res, next)
          const next = arguments[arguments.length - 1]
          return Co(handler.apply(this, arguments)).then(x => next(null, x)).catch(next)
        })
      } else {
        this.actMeta.middleware.push(handler)
      }
    } else {
      this.actMeta.middleware.push(handler)
    }
  }
  /**
   *
   *
   * @param {any} handler
   * @returns
   *
   * @memberOf Add
   */
  use (handler) {
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
  end (cb) {
    this.action = cb
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get middleware () {
    return this.actMeta.middleware
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get schema () {
    return this.actMeta.schema
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get pattern () {
    return this.actMeta.pattern
  }
  /**
   *
   *
   *
   * @memberOf Add
   */
  set action (action) {
    if (this.options.generators) {
      if (!IsGeneratorFn(action)) {
        this.actMeta.action = action
        this.isGenFunc = false
      } else {
        this.actMeta.action = Co.wrap(action)
        this.isGenFunc = true
      }
    } else {
      this.actMeta.action = action
    }
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get action () {
    return this.actMeta.action
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get plugin () {
    return this.actMeta.plugin
  }

}

module.exports = Add
