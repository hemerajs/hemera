'use strict'

const Hp = require('hemera-plugin')
const AWS = require('aws-sdk')
const DynamoStore = require('./store')
const StorePattern = require('hemera-store/pattern')
const Joi = require('joi')

exports.plugin = Hp(hemeraDynamoStore, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi',
  dynamodb: {
    endpoint: 'http://localhost:8000',
    region: 'eu-west-2'
  }
}

function hemeraDynamoStore(hemera, opts, done) {
  let topic = 'dynamo-store'

  var dynamo = new AWS.DynamoDB(opts.dynamodb)
  var db = new AWS.DynamoDB.DocumentClient(opts.dynamodb, dynamo)

  function createDb() {
    return dynamo
  }

  hemera.decorate('dynamoStore', {
    createDb
  })

  hemera.add(StorePattern.create(topic), function (req, cb) {
    const store = new DynamoStore(db)
    store.create(req, cb)
  })

  hemera.add({
    topic,
    cmd: 'removeById',
    id: Joi.required(),
    collection: Joi.string().required()
  }, function (req, cb) {
    const store = new DynamoStore(db)
    store.removeById(req, cb)
  })

  hemera.add({
    topic,
    cmd: 'updateById',
    id: Joi.required(),
    collection: Joi.string().required(),
    UpdateExpression: Joi.string().required,
    ConditionExpression: Joi.string(),
    ExpressionAttributeNames: Joi.object(),
    ExpressionAttributeValues: Joi.object()
  }, function (req, cb) {
    const store = new DynamoStore(db)
    store.updateById(req, cb)
  })

  hemera.add({
    topic,
    cmd: 'findById',
    id: Joi.required(),
    collection: Joi.string().required(),
    ProjectionExpression: Joi.string(),
    ExpressionAttributeNames: Joi.object()
  }, function (req, cb) {
    const store = new DynamoStore(db)
    store.findById(req, cb)
  })

  hemera.add({
    topic,
    cmd: 'query',
    collection: Joi.string().required(),
    KeyConditionExpression: Joi.string().required(),
    FilterExpression: Joi.string(),
    ProjectionExpression: Joi.string(),
    ExpressionAttributeNames: Joi.object(),
    ExpressionAttributeValues: Joi.object()
  }, function (req, cb) {
    const store = new DynamoStore(db)
    store.query(req, cb)
  })

  hemera.add({
    topic,
    cmd: 'scan',
    collection: Joi.string().required(),
    FilterExpression: Joi.string(),
    ProjectionExpression: Joi.string(),
    ExpressionAttributeNames: Joi.object(),
    ExpressionAttributeValues: Joi.object()
  }, function (req, cb) {
    const store = new DynamoStore(db)
    store.scan(req, cb)
  })

  hemera.log.debug('DB connected!')
  done()
}
