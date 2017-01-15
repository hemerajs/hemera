'use strict'


/**
 * Common API methods:
 *
 * create
 * remove
 * removeById
 * update
 * updateById
 * find
 * findById
 * replace
 * replaceById
 *
 * @class Store
 */
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
   *
   *
   *
   * @memberOf Store
   */
  create() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  remove() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  removeById() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  update() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  updateById() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  find() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  findById() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  replace() {
    throw (new Error('Not implemented yet'))
  }
  /**
   *
   *
   *
   * @memberOf Store
   */
  replaceById() {
    throw (new Error('Not implemented yet'))
  }
}

/**
 *
 *
 * @class ArangoStore
 * @extends {Store}
 */
class ArangoStore extends Store {
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

    this._driver.collection(req.collection)
      .save(req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  remove(req, cb) {

    this._driver.collection(req.collection)
      .removeByExample(req.filter, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  removeById(req, cb) {

    this._driver.collection(req.collection)
      .removeByExample(req.id, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  update(req, cb) {

    this._driver.collection(req.collection)
      .updateByExample(req.filter, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  updateById(req, cb) {

    this._driver.collection(req.collection)
      .updateByExample(req.id, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  find(req, cb) {

    this._driver.collection(req.collection)
      .byExample(req.filter, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        res.all(cb)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  findById(req, cb) {

    this._driver.collection(req.collection)
      .byExample(req.id, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return res.next(cb)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  replace(req, cb) {

    this._driver.collection(req.collection)
      .replaceByExample(req.filter, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  replaceById(req, cb) {

    this._driver.collection(req.collection)
      .replaceByExample(req.id, req.data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }

}

module.exports = ArangoStore
