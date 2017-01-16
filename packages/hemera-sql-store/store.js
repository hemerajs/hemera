'use strict'

const Store = require('hemera-store')

/**
 *
 *
 * @class SqlStore
 * @extends {Store}
 */
class SqlStore extends Store {
  /**
   * Creates an instance of ArangoStore.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf ArangoStore
   */
  constructor(driver, options) {

    super(driver, options)
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  create(req, cb) {

    this._driver.table(req.collection).insert(req.data).asCallback(cb);
  }

}

module.exports = SqlStore
