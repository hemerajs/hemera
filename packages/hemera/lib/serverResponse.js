'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const _ = require('lodash')

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
   * @param {*} value
   *
   * @memberOf ServerResponse
   */
  end (value) {
    if (value instanceof Error) {
      if (_.isFunction(this.next)) {
        this.next(value)
      }
    } else {
      if (_.isFunction(this.next)) {
        this.next(null, value, true)
      }
    }
  }

  /**
   *
   *
   * @param {*} value
   *
   * @memberOf ServerResponse
   */
  send (value) {
    if (value instanceof Error) {
      if (_.isFunction(this.next)) {
        this.next(value)
      }
    } else {
      if (_.isFunction(this.next)) {
        this.next(null, value)
      }
    }
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
