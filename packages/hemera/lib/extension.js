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
   * Executes the stack of callbacks and set the correct
   * response and request context
   *
   * @param {any} cb
   *
   * @memberOf Extension
   */
  dispatch (ctx, cb) {
    const each = (item, next) => {
      if (ctx._isServer) {
        const response = ctx._response
        const request = ctx._request
        const reply = new Reply(request, response, next)

        item.call(ctx, request, reply, next)
      } else {
        item.call(ctx, next)
      }
    }

    Util.serialWithCancellation(this._stack, each, cb)
  }
}

module.exports = Extension
