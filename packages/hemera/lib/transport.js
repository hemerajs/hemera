'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 *
 *
 * @class Transport
 */
class NatsTransport {
  /**
   * Creates an instance of NatsTransport.
   *
   * @param {any} params
   *
   * @memberOf NatsTransport
   */
  constructor(params) {
    this.nc = params.transport
  }

  /**
   *
   *
   * @readonly
   *
   * @memberOf NatsTransport
   */
  get driver() {
    return this.nc
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  timeout() {
    return this.nc.timeout.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  send() {
    return this.nc.publish.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  close() {
    return this.nc.close.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   * @memberof NatsTransport
   */
  flush() {
    return this.nc.flush.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  subscribe() {
    return this.nc.subscribe.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  unsubscribe() {
    return this.nc.unsubscribe.apply(this.nc, arguments)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  sendRequest() {
    return this.nc.request.apply(this.nc, arguments)
  }
}

module.exports = NatsTransport
