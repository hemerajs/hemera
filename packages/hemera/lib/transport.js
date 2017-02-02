/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 *
 *
 * @class Transport
 */
export default class NatsTransport {

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
  sendRequest() {

    return this.nc.request.apply(this.nc, arguments)
  }
}
