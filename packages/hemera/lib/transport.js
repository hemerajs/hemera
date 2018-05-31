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
   * @param {*} sid
   * @param {*} timeout
   * @param {*} expected
   * @param {*} callback
   */
  timeout(sid, timeout, expected, callback) {
    return this.nc.timeout(sid, timeout, expected, callback)
  }

  /**
   *
   * @param {*} subject
   * @param {*} msg
   * @param {*} optReply
   * @param {*} optCallback
   */
  send(subject, msg, optReply, optCallback) {
    return this.nc.publish(subject, msg, optReply, optCallback)
  }

  /**
   *
   *
   * @returns
   *
   * @memberOf NatsTransport
   */
  close() {
    return this.nc.close()
  }

  /**
   *
   * @param {*} optCallback
   */
  flush(optCallback) {
    return this.nc.flush(optCallback)
  }

  /**
   *
   * @param {*} subject
   * @param {*} opts
   * @param {*} callback
   */
  subscribe(subject, opts, callback) {
    return this.nc.subscribe(subject, opts, callback)
  }

  /**
   *
   * @param {*} sid
   * @param {*} optMax
   */
  unsubscribe(sid, optMax) {
    return this.nc.unsubscribe(sid, optMax)
  }

  /**
   *
   * @param {*} subject
   * @param {*} optMsg
   * @param {*} optOptions
   * @param {*} callback
   */
  sendRequest(subject, optMsg, optOptions, callback) {
    return this.nc.request(subject, optMsg, optOptions, callback)
  }
}

module.exports = NatsTransport
