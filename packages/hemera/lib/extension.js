'use strict'

const Co = require('co')

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * @class Extension
 */
class Extension {

  constructor (type, options) {
    this._stack = []
    this._options = options
    this._type = type
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Extension
   */
  add (handler) {
    if (this._options.generators) {
      this._stack.push(function () {
        // -3 because (req, res, next, prevValue, index)
        const next = arguments[arguments.length - 3]
        return Co(handler.apply(this, arguments)).then(x => next(null, x)).catch(next)
      })
    } else {
      this._stack.push(handler)
    }
  }

  /**
   *
   *
   * @param {Array<Function>} handlers
   *
   * @memberOf Extension
   */
  addRange (handlers) {
    this._stack = this._stack.concat(handlers)
  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Extension
   */
  invoke (ctx, cb) {
    const each = (item, next, prevValue, i) => {
      if (this._options.server) {
        const response = ctx._response
        const request = ctx._request
        // pass next handler to response object to react on errors
        response.next = next

        item.call(ctx, request, response, next, prevValue, i)
      } else {
        item.call(ctx, next, i)
      }
    }

    Extension.serial(this._stack, each, cb.bind(ctx))
  }

  /**
   *
   *
   * @param {any} array
   * @param {any} method
   * @param {any} callback
   *
   * @memberOf Extension
   */
  static parallel (array, method, callback) {
    if (!array.length) {
      callback()
    } else {
      let count = 0
      let abort = false
      let errored = false

      const done = function (err, value, cancel) {
        if (!errored && !abort) {
          if (err) {
            errored = true
            callback(err)
          } else if (value && cancel) {
            abort = true
            callback(null, value)
          } else {
            count = count + 1
            if (count === array.length) {
              callback(null, value)
            }
          }
        }
      }

      for (let i = 0; i < array.length; ++i) {
        method(array[i], done, i)
      }
    }
  }
  /**
   *
   *
   * @param {Array<Function>} array
   * @param {Function} method
   * @param {Function} callback
   *
   * @memberOf Extension
   */
  static serial (array, method, callback) {
    if (!array.length) {
      callback()
    } else {
      let i = 0

      const iterate = function (prevValue) {
        const done = function (err, value, abort) {
          if (err) {
            callback(err)
          } else if (value && abort) {
            callback(null, value)
          } else {
            i = i + 1

            if (i < array.length) {
              iterate(value)
            } else {
              callback(null, value)
            }
          }
        }

        method(array[i], done, prevValue, i)
      }

      iterate()
    }
  }
}

module.exports = Extension
