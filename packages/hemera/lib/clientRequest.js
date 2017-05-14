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
 * @class ClientRequest
 */
class ClientRequest {
  /**
   * Creates an instance of ClientRequest.
   *
   * @param {Hemera} ctx
   *
   * @memberOf ClientRequest
   */
  constructor () {
    this._request = {}
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientRequest
   */
  get payload () {
    return this._request.value
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientRequest
   */
  get error () {
    return this._request.error
  }

  /**
   *
   *
   *
   * @memberOf ClientRequest
   */
  set payload (value) {
    this._request.value = value
  }

  /**
   *
   *
   *
   * @memberOf ClientRequest
   */
  set error (error) {
    this._request.error = error
  }
}

module.exports = ClientRequest
