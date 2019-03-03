'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class ClientRequest {
  constructor(pattern) {
    this.error = null
    // almost any falsy value like 0, '', null can be send except undefined
    this.payload = undefined
    this.pattern = pattern
    this.transport = {
      topic: pattern.topic,
      pubsub: pattern.pubsub$,
      maxMessages: pattern.maxMessages$,
      expectedMessages: pattern.expectedMessages$
    }
  }
}

module.exports = ClientRequest
