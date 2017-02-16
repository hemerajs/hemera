'use strict'

/**
 *
 *
 * @class Store
 */
class Store {

  /**
   * Creates an instance of Store.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf Store
   */
  constructor(driver, options) {

    this._driver = driver
    this._options = options
  }

  /**
   * Returns the underlying driver instance
   *
   * @readonly
   *
   * @memberOf Store
   */
  get driver() {

    return this._driver
  }

  /**
   * Returns the store options
   *
   * @readonly
   *
   * @memberOf Store
   */
  get options() {

    return this._options
  }
  /**
   * Create a new entity
   *
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  create(data, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Removes multiple entitys
   *
   * @param {object} query
   * @param {function} cb
   *
   * @memberOf Store
   */
  remove(query, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Remove an entity by id
   *
   * @param {object} id
   * @param {function} cb
   *
   * @memberOf Store
   */
  removeById(id, cb) {
    throw (new Error('Not implemented yet'))
  }
  /**
   * Update an entity
   *
   * @param {object} query
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  update(query, data, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Update an entity by id
   *
   * @param {object} id
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  updateById(id, data, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Find an entity
   *
   * @param {object} query
   * @param {object} options
   * @param {function} cb
   *
   * @memberOf Store
   */
  find(query, options, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Find an entity by id
   *
   * @param {object} id
   * @param {function} cb
   *
   * @memberOf Store
   */
  findById(id, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Replace an entity
   *
   * @param {object} query
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  replace(query, data, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Replace an entity by id
   *
   * @param {object} id
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  replaceById(id, data, cb) {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Check if an entity exists
   *
   * @param {object} query
   * @param {function} cb
   *
   * @memberOf Store
   */
  exists(query, cb) {
    throw (new Error('Not implemented yet'))
  }
}

module.exports = Store
