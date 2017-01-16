'use strict'

const Store = require('hemera-store')

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
  remove(filter, cb) {

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

  update(req, data, cb) {

    this._driver.collection(req.collection)
      .updateByExample(req.filter, data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }

  updateById(req, data, cb) {

    this._driver.collection(req.collection)
      .updateByExample(req.id, data, (err, res) => {

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
  find(req, options, cb) {

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
  replace(req, data, cb) {

    this._driver.collection(req.collection)
      .replaceByExample(req.filter, data, (err, res) => {

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
  replaceById(req, data, cb) {

    this._driver.collection(req.collection)
      .replaceByExample(req.id, data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }

}

module.exports = ArangoStore
