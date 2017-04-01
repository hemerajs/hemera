'use strict'

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
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
