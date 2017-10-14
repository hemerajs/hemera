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
 * @class CodecPipeline
 */
class CodecPipeline {
  /**
   * Creates an instance of CodecPipeline.
   * @memberof CodecPipeline
   */
  constructor(type) {
    this._type = type
    this._stack = []
    return this
  }

  /**
   * Create a new pipline step
   *
   * @memberof CodecPipeline
   */
  add(step) {
    this._stack.push(step)
    return this
  }

  /**
   * Reset the stack and add optionally an element
   *
   * @param {any} step
   * @returns
   * @memberof CodecPipeline
   */
  reset(step) {
    this._stack = step ? [step] : []
    return this
  }

  /**
   * Add the element at the beginning of the stack
   *
   * @param {any} step
   * @returns
   * @memberof CodecPipeline
   */
  first(step) {
    this._stack.unshift(step)
    return this
  }
  /**
   * Accumulate value
   *
   * @returns
   * @memberof CodecPipeline
   */
  run(msg, ctx) {
    let firstError = null

    const value = this._stack.reduce((data, item, index) => {
      const result = item.call(ctx, data)
      if (!firstError && result.error) {
        firstError = result.error
      }
      return result.value
    }, msg)

    return { value, error: firstError }
  }
}

module.exports = CodecPipeline
