'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SafeStringify = require('fast-safe-stringify')

class Encoder {

  static encode (msg) {
    try {
      return {
        value: SafeStringify(msg)
      }
    } catch (error) {
      return {
        error
      }
    }
  }
}

module.exports = Encoder
