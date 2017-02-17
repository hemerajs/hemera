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
   * Creates an instance of SqlStore.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf SqlStore
   */
  constructor (driver, options) {
    super(driver, options)
  }
  
  /**
   * Create a new entity
   *
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  create (req, cb) {
    this._driver
      .insert(req.data)
      .into(req.collection)
      .asCallback(cb)
  }

  /**
   * Removes multiple entitys
   *
   * @param {object} query
   * @param {function} cb
   *
   * @memberOf Store
   */
  remove(req, cb) {
    this._driver(req.collection).where(req.query).del().asCallback(cb)
  }

  /**
   * Remove an entity by id
   *
   * @param {object} id
   * @param {function} cb
   *
   * @memberOf Store
   */
  removeById(req, cb) {
    this._driver(req.collection).where('id', req.id).del().asCallback(cb)
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
  update(req, data, cb) {
    this._driver(req.collection).where(req.query).update(data).asCallback(cb)
  }

  /**
   * Update an entity by id
   *
   * @param {object} req
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  updateById(req, data, cb) {
    this._driver(req.collection).where('id', req.id).update(data).asCallback(cb)
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
  find(req, options, cb) {
    const queryBuilder = this._driver(req.collection).where(req.query)
    if (options.orderBy) {
      queryBuilder.orderByRaw(options.orderBy)
    }
    if (options.limit) {
      queryBuilder.limit(options.limit)
    }
    if (options.offset) {
      queryBuilder.offset(options.offset)
    }
    if (options.fields) {
      queryBuilder.select(options.fields)
    }
    queryBuilder.asCallback(cb)
  }

  /**
   * Find an entity by id
   *
   * @param {object} req
   * @param {function} cb
   *
   * @memberOf Store
   */
  findById(req, cb) {
    this._driver(req.collection).where('id', req.id)
    .asCallback(cb)
  }

  /**
   * Replace an entity
   *
   * @param {object} req
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  replace(req, data, cb) {
    this.update(req, data, cb)
  }

  /**
   * Replace an entity by id
   *
   * @param {object} req
   * @param {object} data
   * @param {function} cb
   *
   * @memberOf Store
   */
  replaceById(req, data, cb) {
    this.updateById(req, data, cb)
  }

  /**
   * Check if an entity exists
   *
   * @param {object} req
   * @param {function} cb
   *
   * @memberOf Store
   */
  exists(req, cb) {
    this._driver(req.collection).where(req.query).first('id')
    .then(row => {
      cb(null, {exists: row !== null})
    })
    .catch(err => cb(err))
  }

}

module.exports = SqlStore
