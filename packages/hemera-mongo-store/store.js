'use strict'

const Store = require('hemera-store')

/**
 *
 *
 * @class MongoStore
 * @extends {Store}
 */
class MongoStore extends Store {

  /**
   * Creates an instance of MongoStore.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf MongoStore
   */
  constructor (driver, options = {}) {
    options.mongo = {}
    super(driver, options)
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  create (req, cb) {
    this._driver.insertOne(req.data, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  remove (req, cb) {
    this._driver.deleteMany(req.query, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  removeById (req, cb) {
    this._driver.findOneAndDelete({ _id: this.ObjectID(req.id) }, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} data
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  update (req, data, cb) {
    this._driver.findOneAndUpdate(req.query, data, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} data
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  updateById (req, data, cb) {
    this._driver.findOneAndUpdate({ _id: this.ObjectID(req.id) }, data, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  find (req, options, cb) {
    this._driver.find(req.query, options).toArray(function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  findById (req, cb) {
    this._driver.findOne({ _id: this.ObjectID(req.id) }, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  replace (req, data, cb) {
    this._driver.updateMany(req.query, data, Object.assign(this.options.mongo, { upsert: true }), function (err, resp) {
      cb(err, resp.result)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  replaceById (req, data, cb) {
    this._driver.findOneAndReplace({ _id: this.ObjectID(req.id) }, data, this.options.mongo, function (err, resp) {
      cb(err, resp.result)
    })
  }

}

module.exports = MongoStore
