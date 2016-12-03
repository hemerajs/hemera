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
   * @returns
   * 
   * @memberOf Util
   */
  static createUniqueId() {

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
  /**
   * 
   * 
   * @param {any} args
   * @returns
   * 
   * @memberOf Util
   */
  static pattern(args) {

    if (_.isString(args)) {
      return args
    }

    args = args || {}
    var sb = []
    _.each(args, function (v, k) {
      if (!~k.indexOf('$') && !_.isFunction(v)) {
        sb.push(k + ':' + v)
      }
    })

    sb.sort()

    return sb.join(',')
  }

}

module.exports = Util