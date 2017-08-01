'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const Reply = require('./reply')
const BaseExtension = require('./baseExtension')

/**
 *
 *
 * @class ServerExtension
 * @extends {BaseExtension}
 */
class ServerExtension extends BaseExtension {
  /**
   * Executes the stack of functions and set the correct
   * response and request context
   *
   * @param {any} cb
   *
   * @memberOf Extension
   */
  dispatch (ctx, cb) {
    const each = (item, next) => {
      const response = ctx._response
      const request = ctx._request
      const reply = new Reply(request, response, next)

      item(ctx, request, reply, next)
    }

    this.run(each, cb)
  }
}

module.exports = ServerExtension
