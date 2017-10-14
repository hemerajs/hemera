'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class Decoder {
  static decode(msg) {
    return Parse(msg)
  }
}

function Parse(data) {
  if (!(this instanceof Parse)) {
    return new Parse(data)
  }

  this.error = null
  this.value = null

  try {
    this.value = JSON.parse(data)
  } catch (error) {
    this.error = error
  }
}

module.exports = Decoder
