'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class ServerRequest {
  constructor(payload) {
    this.payload = payload
    this.error = undefined
  }
}

module.exports = ServerRequest
