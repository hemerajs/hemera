'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SuperError = require('super-error')

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
  constructor(replyTo) {
    this._response = {}
    this.replyTo = replyTo
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerResponse
   */
  get payload() {
    return this._response.value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set payload(value) {
    this._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set error(error) {
    if (error instanceof SuperError) {
      this._response.error = error.rootCause || error.cause || error
    } else {
      this._response.error = error
    }
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerResponse
   */
  get error() {
    return this._response.error
  }
}

module.exports = ServerResponse
