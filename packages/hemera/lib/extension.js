'use strict'

const Co = require('co')
const IsGeneratorFn = require('is-generator-function')
const _ = require('lodash')

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
   * @memberof Extension
   */
  _add (handler) {
    if (this._options.generators) {
      if (IsGeneratorFn(handler)) {
        this._stack.push(function () {
        // -3 because (req, res, next, prevValue, index)
          const next = arguments[arguments.length - 3]
          return Co(handler.apply(this, arguments)).then(x => next(null, x)).catch(next)
        })
      } else {
        this._stack.push(handler)
      }
    } else {
      this._stack.push(handler)
    }
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
   * @param {any} cb
   *
   * @memberOf Extension
   */
  invoke (ctx, cb) {
    const each = (item, next, prevValue, i) => {
      if (this._options.server) {
        const response = ctx._response
        const request = ctx._request
        // pass next handler to response object so that the user can abort the response with msg or error
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
