'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const BaseExtension = require('./base-extension')

/**
 *
 *
 * @class Extension
 */
class Extension extends BaseExtension {
  /**
   * Executes the stack of functions
   *
   * @param {any} ctx
   * @param {any} cb
   * @memberof Extension
   */
  dispatch (ctx, cb) {
    const each = (item, next) => {
      item.call(ctx, next)
    }

    this.run(each, cb)
  }
}

module.exports = Extension
