'use strict'

const NUID = require('nuid')

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class Util {
  static escapeTopicForRegExp(string) {
    return string.replace(/[.+?]/g, '\\$&') // $& Inserts the matched substring.
  }

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
   * Generates a unique random id
   * Total length of a NUID string is 22 bytes of base 36 ascii text
   */
  static randomId() {
    return NUID.next()
  }
  /**
   * Get high resolution time in miliseconds
   *
   * @static
   * @returns
   *
   * @memberOf Util
   */
  static nowHrTime() {
    var ts = process.hrtime()
    return ts[0] * 1e3 + ts[1] / 1e6
  }

  static extractSchema(obj) {
    if (obj === null) return obj

    const o = {}

    for (let key in obj) {
      if (typeof obj[key] === 'object') {
        o[key] = obj[key]
      }
    }

    return o
  }

  static cleanPattern(obj) {
    if (obj === null) return obj

    const o = {}

    for (let key in obj) {
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

  static cleanFromSpecialVars(obj) {
    if (obj === null) return obj

    const o = {}

    for (let key in obj) {
      if (!key.endsWith('$')) {
        o[key] = obj[key]
      }
    }
    return o
  }

  static pattern(args) {
    if (typeof args === 'string') {
      return args
    }

    const obj = Util.cleanPattern(args)
    let sb = []

    for (let key in obj) {
      sb.push(key + ':' + obj[key])
    }

    sb.sort()

    return sb.join(',')
  }
}

module.exports = Util
