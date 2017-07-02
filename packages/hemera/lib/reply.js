'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 *
 *
 * @class Reply
 */
class Reply {
  /**
   * Creates an instance of Reply.
   * @param {any} request
   * @param {any} response
   * @param {any} extensionCallback
   *
   * @memberof Reply
   */
  constructor (request, response, extensionCallback) {
    this._request = request
    this._response = response
    this.extensionCallback = extensionCallback
  }

  /**
   *
   *
   * @param {any} payload
   *
   * @memberof Reply
   */
  set payload (value) {
    this._response.payload = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get payload () {
    return this._response.payload
  }

  /**
   *
   *
   *
   * @memberof Reply
   */
  set error (value) {
    this._response.error = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get error () {
    return this._response.error
  }

  /**
   * Abort the current request and respond wih the passed value
   *
   * @param {any} value
   *
   * @memberof Reply
   */
  end (value) {
    if (value instanceof Error) {
      this.extensionCallback(value)
    } else {
      this.extensionCallback(null, value, true)
    }
  }

  /**
   * Runs through all extensions and keep the passed value to respond it
   *
   * @param {any} value
   *
   * @memberof Reply
   */
  send (value) {
    if (value instanceof Error) {
      this.extensionCallback(value)
    } else {
      this.extensionCallback(null, value)
    }
  }
}

module.exports = Reply
