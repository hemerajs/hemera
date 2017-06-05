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
 * @class ServerResponse
 */
class ServerResponse {
  /**
   * Creates an instance of ServerResponse.
   *
   * @param {Hemera} ctx
   *
   * @memberOf ServerResponse
   */
  constructor () {
    this._response = {}
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerResponse
   */
  get payload () {
    return this._response.value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set payload (value) {
    this._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set error (error) {
    this._response.error = error
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerResponse
   */
  get error () {
    return this._response.error
  }
}

module.exports = ServerResponse
