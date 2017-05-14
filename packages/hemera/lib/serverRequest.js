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
 * @class ServerRequest
 */
class ServerRequest {
  /**
   * Creates an instance of ServerRequest.
   *
   * @param {*} payload
   *
   * @memberOf ServerRequest
   */
  constructor (payload) {
    this._request = {}
    this._locals = {}
    this.payload = payload
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerRequest
   */
  get payload () {
    return this._request.value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof ServerRequest
   */
  get locals () {
    return this._locals
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerRequest
   */
  get error () {
    return this._request.error
  }

  /**
   *
   *
   *
   * @memberOf ServerRequest
   */
  set payload (value) {
    this._request.value = value
  }

  /**
   *
   *
   *
   * @memberOf ServerRequest
   */
  set error (error) {
    this._request.error = error
  }
}

module.exports = ServerRequest
