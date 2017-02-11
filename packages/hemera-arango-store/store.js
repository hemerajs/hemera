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
  remove(req, cb) {

    this._driver.collection(req.collection)
      .removeByExample(req.query, (err, res) => {

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
      .removeByExample({ _id: req.id }, (err, res) => {

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
   * @param {any} data
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  update(req, data, cb) {

    this._driver.collection(req.collection)
      .updateByExample(req.query, data, (err, res) => {

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
   * @param {any} data
   * @param {any} cb
   *
   * @memberOf ArangoStore
   */
  updateById(req, data, cb) {

    this._driver.collection(req.collection)
      .updateByExample({ _id: req.id }, data, (err, res) => {

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
      .byExample(req.query, (err, res) => {

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
      .byExample({ _id: req.id }, (err, res) => {

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
      .replaceByExample(req.query, data, (err, res) => {

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
      .replaceByExample({ _id: req.id }, data, (err, res) => {

        if (err) {
          return cb(new Error(err.message))
        }

        return cb(null, res)

      })
  }

}

module.exports = ArangoStore
