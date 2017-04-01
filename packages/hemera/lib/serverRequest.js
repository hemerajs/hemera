'use strict'

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
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
