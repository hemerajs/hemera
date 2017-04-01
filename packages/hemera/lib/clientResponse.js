'use strict'

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ClientResponse
 */
class ClientResponse {

  /**
   * Creates an instance of ClientResponse.
   *
   *
   * @memberOf ClientResponse
   */
  constructor () {
    this._response = {}
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientResponse
   */
  get payload () {
    return this._response.value
  }

  /**
   *
   *
   *
   * @memberOf ClientResponse
   */
  set payload (value) {
    this._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf ClientResponse
   */
  set error (error) {
    this._response.error = error
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientResponse
   */
  get error () {
    return this._response.error
  }

}

module.exports = ClientResponse
