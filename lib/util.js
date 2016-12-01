/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const
  _ = require('lodash'),
  NUID = require('nuid'),
  SafeStringify = require('fast-safe-stringify'),
  Parse = require('fast-json-parse')

/**
 * 
 * 
 * @class Util
 */
class Util {
  /**
   * 
   * 
   * @param {any} pattern
   * @returns
   * 
   * @memberOf Util
   */
  static createRequestId(pattern) {

      return NUID.next()
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
      return Math.floor(hrtime[0] * 1000000 + hrtime[1] / 1000)
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
  static cleanPattern(obj) {

      if (obj === null) return obj

      return _.pickBy(obj, function (val, prop) {
        return !_.includes(prop, '$')
      })
    }
    /**
     * 
     * 
     * @static
     * @param {any} msg
     * @returns
     * 
     * @memberOf Util
     */
  static parseJSON(msg) {

      return Parse(msg)
    }
    /**
     * 
     * 
     * @static
     * @param {any} msg
     * @returns
     * 
     * @memberOf Util
     */
  static stringifyJSON(msg) {

    return SafeStringify(msg)
  }

}

module.exports = Util