// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ServerRequest
 */
class ServerRequest {

  _request: any;

  /**
   * Creates an instance of ServerRequest.
   *
   * @param {*} payload
   *
   * @memberOf ServerRequest
   */
  constructor(payload: any) {

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
  get payload(): any {

    return this._request.value
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerRequest
   */
  get error(): any {

    return this._request.error
  }

  /**
   *
   *
   *
   * @memberOf ServerRequest
   */
  set payload(value: any) {

    this._request.value = value
  }

  /**
   *
   *
   *
   * @memberOf ServerRequest
   */
  set error(error: Error) {

    this._request.error = error
  }

}

module.exports = ServerRequest
