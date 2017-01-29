// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ClientResponse
 */
class ClientResponse {

  _ctx: Hemera;
  _response: any;

  /**
   * Creates an instance of ClientResponse.
   *
   * @param {Hemera} ctx
   *
   * @memberOf ClientResponse
   */
  constructor(ctx: Hemera) {

    this._ctx = ctx
    this._response = {}
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientResponse
   */
  get payload(): any {

    return this._response.value
  }

  /**
   *
   *
   *
   * @memberOf ClientResponse
   */
  set payload(value: any) {

    this._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf ClientResponse
   */
  set error(error: Error) {

    this._response.error = error
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientResponse
   */
  get error(): any {

    return this._response.error
  }

}

module.exports = ClientResponse
