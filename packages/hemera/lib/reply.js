'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Constants = require('./constants')

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
   * @param {any} hemera
   *
   * @memberof Reply
   */
  constructor(request, response, logger) {
    this._request = request
    this._response = response
    this.log = logger
    this.sent = false
    this.finished = false
    this._errored = false
  }

  /**
   *
   *
   * @param {any} payload
   *
   * @memberof Reply
   */
  set payload(value) {
    this._response.payload = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get payload() {
    return this._response.payload
  }

  /**
   * Set the response error
   * Error can not be set twice
   *
   * @memberof Reply
   */
  set error(value) {
    if (this._errored) {
      this.log.debug(new Error(Constants.REPLY_ERROR_ALREADY_SET))
      return
    }

    this._errored = true
    this._response.error = value
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof Reply
   */
  get error() {
    return this._response.error
  }
  /**
   *
   *
   * @memberof Reply
   */
  end(msg) {
    this.finished = true

    if (msg) {
      this.send(msg)
    }
  }

  /**
   * Set the response error
   *
   * @param {any} msg
   * @memberof Reply
   */
  send(msg) {
    const self = this

    if (self.sent) {
      self.log.warn(new Error(Constants.REPLY_ALREADY_SENT))
      return
    }

    self.sent = true

    if (msg) {
      if (msg instanceof Error) {
        self.error = msg
      } else {
        self.payload = msg
      }
    }
  }
}

module.exports = Reply
