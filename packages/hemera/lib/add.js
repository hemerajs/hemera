/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

const _ = require('lodash')

/**
 *
 *
 * @export
 * @class Add
 */
class Add {

  /**
   * Creates an instance of Add.
   * @param {any} actMeta
   *
   * @memberOf Add
   */
  constructor (actMeta) {
    this.actMeta = actMeta
    this.actMeta.middleware = actMeta.middleware || []
  }

  /**
   *
   *
   * @param {any} handler
   * @returns
   *
   * @memberOf Add
   */
  use (handler) {
    if (_.isArray(handler)) {
      this.actMeta.middleware = this.actMeta.middleware.concat(handler)
    } else {
      this.actMeta.middleware.push(handler)
    }
    return this
  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Add
   */
  end (cb) {
    this.actMeta.action = cb
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get middleware () {
    return this.actMeta.middleware
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get schema () {
    return this.actMeta.schema
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get pattern () {
    return this.actMeta.pattern
  }
  /**
   *
   *
   *
   * @memberOf Add
   */
  set action (action) {
    this.actMeta.action = action
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get action () {
    return this.actMeta.action
  }
  /**
   *
   *
   * @readonly
   *
   * @memberOf Add
   */
  get plugin () {
    return this.actMeta.plugin
  }

}

module.exports = Add
