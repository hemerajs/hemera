'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const Util = require('./util')
const _ = require('lodash')

/**
 * @class Extension
 */
class Extension {
  constructor (type) {
    this._stack = []
    this._type = type
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberof Extension
   */
  _add (handler) {
    this._stack.push(Util.toPromiseFact(handler))
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Extension
   */
  add (handler) {
    if (_.isArray(handler)) {
      handler.forEach(h => this._add(h))
    } else {
      this._add(handler)
    }
  }

  /**
   *
   *
   * @param {any} each
   * @param {any} cb
   * @memberof Extension
   */
  run (each, cb) {
    Util.serialWithCancellation(this._stack, each, cb)
  }
}

module.exports = Extension
