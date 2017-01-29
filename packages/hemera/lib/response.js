// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import _ from 'lodash'

/**
 * @class Response
 */
class Response {

  next: Function;
  ctx: Hemera;

  /**
   * Creates an instance of Response.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Response
   */
  constructor(ctx: Hemera) {

    this.ctx = ctx
  }

  /**
   *
   *
   * @param {*} value
   *
   * @memberOf Response
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
   * @memberOf Response
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
   * @memberOf Response
   */
  get payload(): any {

    return this.ctx._response.value
  }

  /**
   *
   *
   *
   * @memberOf Response
   */
  set payload(value) {

    this.ctx._response.value = value
  }

  /**
   *
   *
   *
   * @memberOf Response
   */
  set error(error) {

    this.ctx._response.error = error
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf Response
   */
  get error(): any {

    return this.ctx._response.error
  }

}

module.exports = Response
