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
  constructor (driver, options) {
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
  get driver () {
    return this._driver
  }

  /**
   * Returns the store options
   *
   * @readonly
   *
   * @memberOf Store
   */
  get options () {
    return this._options
  }
  /**
   * Create a new entity
   *
   *
   * @memberOf Store
   */
  create () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Removes multiple entitys
   *
   *
   * @memberOf Store
   */
  remove () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Remove an entity by id
   *
   *
   * @memberOf Store
   */
  removeById () {
    throw (new Error('Not implemented yet'))
  }
  /**
   * Update an entity
   *
   *
   * @memberOf Store
   */
  update () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Update an entity by id
   *
   *
   * @memberOf Store
   */
  updateById () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Find an entity
   *
   *
   * @memberOf Store
   */
  find () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Find an entity by id
   *
   *
   * @memberOf Store
   */
  findById () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Replace an entity
   *
   *
   * @memberOf Store
   */
  replace () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Replace an entity by id
   *
   *
   * @memberOf Store
   */
  replaceById () {
    throw (new Error('Not implemented yet'))
  }

  /**
   * Check if an entity exists
   *
   * @memberOf Store
   */
  exists () {
    throw (new Error('Not implemented yet'))
  }
}

module.exports = Store
