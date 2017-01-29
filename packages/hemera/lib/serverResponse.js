// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import _ from 'lodash'

/**
 * @class ServerResponse
 */
class ServerResponse {

  next: Function;
  _ctx: Hemera;
  _response: any;

  /**
   * Creates an instance of ServerResponse.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Response
   */
  constructor(ctx: Hemera) {

    this._ctx = ctx
    this._response = {}
  }

  /**
   *
   *
   * @param {*} value
   *
   * @memberOf ServerResponse
   */
  end(value: any) {

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
  send(value: any) {

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
  get payload(): any {

    return this._response.value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set payload(value: any) {

    this._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf ServerResponse
   */
  set error(error: Error) {

    this._response.error = error
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerResponse
   */
  get error(): any {

    return this._response.error
  }

}

module.exports = ServerResponse
