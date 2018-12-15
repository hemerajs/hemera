'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class NatsTransport {
  constructor(params) {
    this.nc = params.transport
  }

  get driver() {
    return this.nc
  }

  timeout(sid, timeout, expected, callback) {
    return this.nc.timeout(sid, timeout, expected, callback)
  }

  send(subject, msg, optReply, optCallback) {
    return this.nc.publish(subject, msg, optReply, optCallback)
  }

  close() {
    return this.nc.close()
  }

  flush(optCallback) {
    return this.nc.flush(optCallback)
  }

  subscribe(subject, opts, callback) {
    return this.nc.subscribe(subject, opts, callback)
  }

  unsubscribe(sid, optMax) {
    return this.nc.unsubscribe(sid, optMax)
  }

  sendRequest(subject, optMsg, optOptions, callback) {
    return this.nc.request(subject, optMsg, optOptions, callback)
  }
}

module.exports = NatsTransport
