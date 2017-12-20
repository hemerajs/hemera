'use strict'

const Store = require('hemera-store')

/**
 *
 *
 * @class DynamoStore
 * @extends {Store}
 */
class DynamoStore extends Store {
  /**
   * Creates an instance of DynamoStore.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf DynamoStore
   */
  constructor(driver, options = {}) {
    options.dynamo = {}
    super(driver, options)
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */
  create(req, cb) {
    const params = {
      TableName: req.collection,
      Item: req.data
    }
    this._driver.put(params, function (err, data) {
      if (err) cb(err)
      cb(null, params.Item)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */
  removeById(req, cb) {
    const params = {
      TableName: req.collection,
      Key: {
        'id': req.id
      },
      ReturnValues: 'ALL_OLD'
    }
    this._driver.delete(params, function (err, data) {
      if (err) cb(err)
      cb(null, data)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */
  updateById(req, cb) {
    const params = {
      TableName: req.collection,
      Key: {
        'id': req.id
      },
      UpdateExpression: req.UpdateExpression,
      ConditionExpression: req.ConditionExpression,
      ExpressionAttributeNames: req.ExpressionAttributeNames,
      ExpressionAttributeValues: req.ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }
    this._driver.update(params, function (err, data) {
      if (err) cb(err)
      cb(null, data)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */
  findById(req, cb) {
    const params = {
      TableName: req.collection,
      Key: {
        'id': req.id
      },
      ProjectionExpression: req.ProjectionExpression,
      ExpressionAttributeNames: req.ExpressionAttributeNames
    }
    this._driver.get(params, function (err, data) {
      if (err) cb(err)
      cb(null, data.Item)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */

  query(req, cb) {
    const params = {
      TableName: req.collection,
      KeyConditionExpression: req.KeyConditionExpression,
      FilterExpression: req.FilterExpression,
      ProjectionExpression: req.ProjectionExpression,
      ExpressionAttributeNames: req.ExpressionAttributeNames,
      ExpressionAttributeValues: req.ExpressionAttributeValues
    }
    this._driver.query(params, function (err, data) {
      if (err) cb(err)
      cb(null, data)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf DynamoStore
   */

  scan(req, cb) {
    const params = {
      TableName: req.collection,
      FilterExpression: req.FilterExpression,
      ProjectionExpression: req.ProjectionExpression,
      ExpressionAttributeNames: req.ExpressionAttributeNames,
      ExpressionAttributeValues: req.ExpressionAttributeValues
    }
    this._driver.scan(params, function (err, data) {
      if (err) cb(err)
      cb(null, data)
    })
  }
}

module.exports = DynamoStore
