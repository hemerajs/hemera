'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const lut = []
for (let i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + i.toString(16)
}

const NS_PER_SEC = 1e9

/**
 * @class Util
 */
class Util {
  static escapeTopicForRegExp(string) {
    return string.replace(/[.+?]/g, '\\$&') // $& Inserts the matched substring.
  }
  /**
   *
   *
   * @static
   * @param {any} subject
   * @returns
   *
   * @memberof Util
   */
  static natsWildcardToRegex(subject) {
    if (subject instanceof RegExp) {
      return subject
    }

    let hasTokenWildcard = subject.toString().indexOf('*') > -1
    let hasFullWildcard = subject.toString().indexOf('>') > -1

    if (hasFullWildcard) {
      subject = Util.escapeTopicForRegExp(subject).replace(
        '>',
        '[a-zA-Z0-9-.]+'
      )
      return new RegExp('^' + subject + '$', 'i')
    } else if (hasTokenWildcard) {
      subject = Util.escapeTopicForRegExp(subject).replace(
        /\*/g,
        '[a-zA-Z0-9-]+'
      )
      return new RegExp('^' + subject + '$', 'i')
    }

    return subject
  }

  /**
   * @returns
   * Fast ID generator: e7 https://jsperf.com/uuid-generator-opt/18
   * @memberOf Util
   */
  static randomId() {
    const d0 = (Math.random() * 0xffffffff) | 0
    const d1 = (Math.random() * 0xffffffff) | 0
    const d2 = (Math.random() * 0xffffffff) | 0
    const d3 = (Math.random() * 0xffffffff) | 0
    return (
      lut[d0 & 0xff] +
      lut[(d0 >> 8) & 0xff] +
      lut[(d0 >> 16) & 0xff] +
      lut[(d0 >> 24) & 0xff] +
      lut[d1 & 0xff] +
      lut[(d1 >> 8) & 0xff] +
      lut[((d1 >> 16) & 0x0f) | 0x40] +
      lut[(d1 >> 24) & 0xff] +
      lut[(d2 & 0x3f) | 0x80] +
      lut[(d2 >> 8) & 0xff] +
      lut[(d2 >> 16) & 0xff] +
      lut[(d2 >> 24) & 0xff] +
      lut[d3 & 0xff] +
      lut[(d3 >> 8) & 0xff] +
      lut[(d3 >> 16) & 0xff] +
      lut[(d3 >> 24) & 0xff]
    )
  }
  /**
   * Get high resolution time in nanoseconds
   *
   * @static
   * @returns
   *
   * @memberOf Util
   */
  static nowHrTime() {
    const hrtime = process.hrtime()
    return +hrtime[0] * NS_PER_SEC + +hrtime[1]
  }
  /**
   *
   *
   * @static
   * @param {any} obj
   * @returns
   *
   * @memberOf Util
   */
  static extractSchema(obj) {
    if (obj === null) return obj

    const o = {}

    for (var key in obj) {
      if (typeof obj[key] === 'object') {
        o[key] = obj[key]
      }
    }

    return o
  }
  /**
   * @static
   * @param {any} obj
   * @returns
   *
   * @memberOf Util
   */
  static cleanPattern(obj) {
    if (obj === null) return obj

    const o = {}

    for (var key in obj) {
      if (
        !key.endsWith('$') &&
        (typeof obj[key] !== 'object' || obj[key] instanceof RegExp) &&
        typeof obj[key] !== 'function'
      ) {
        o[key] = obj[key]
      }
    }

    return o
  }

  /**
   * @static
   * @param {any} obj
   * @returns
   *
   * @memberOf Util
   */
  static cleanFromSpecialVars(obj) {
    if (obj === null) return obj

    const o = {}

    for (var key in obj) {
      if (!key.endsWith('$')) {
        o[key] = obj[key]
      }
    }
    return o
  }

  /**
   * @param {any} args
   * @returns
   *
   * @memberOf Util
   */
  static pattern(args) {
    if (typeof args === 'string') {
      return args
    }

    const obj = Util.cleanPattern(args)
    let sb = []

    for (var key in obj) {
      sb.push(key + ':' + obj[key])
    }

    sb.sort()

    return sb.join(',')
  }
}

module.exports = Util
