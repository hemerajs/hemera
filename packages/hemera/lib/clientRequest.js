// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ClientRequest
 */
class ClientRequest {

  _request: any;

  /**
   * Creates an instance of ClientRequest.
   *
   * @param {Hemera} ctx
   *
   * @memberOf ClientRequest
   */
  constructor() {

    this._request = {}
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientRequest
   */
  get payload(): any {

    return this._request.value
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientRequest
   */
  get error(): any {

    return this._request.error
  }

  /**
   *
   *
   *
   * @memberOf ClientRequest
   */
  set payload(value: any) {

    this._request.value = value
  }

  /**
   *
   *
   *
   * @memberOf ClientRequest
   */
  set error(error: Error) {

    this._request.error = error
  }

}

module.exports = ClientRequest
