// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class Request
 */
class Request {

  ctx: Hemera;

  /**
   * Creates an instance of Request.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Request
   */
  constructor(ctx: Hemera) {

    this.ctx = ctx
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf Request
   */
  get payload(): any {

    return this.ctx._request.value
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf Request
   */
  get error(): any {

    return this.ctx._request.error
  }

  /**
   *
   *
   *
   * @memberOf Response
   */
  set payload(value) {

    this.ctx._request.value = value
  }

  /**
   *
   *
   *
   * @memberOf Response
   */
  set error(error) {

    this.ctx._request.error = error
  }

}

module.exports = Request
