'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraDynamo = require('./../../packages/hemera-dynamo-store')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraDynamo, {
    dynamodb: {
    endpoint: 'http://localhost:8000',
    region: 'eu-west-2'
  }
})

hemera.ready(() => {

  hemera.act(
    {
      topic: 'dynamo-store',
      cmd: 'create',
      collection: 'test',
      data: {
        id: "1111",
        name: 'John Doe'
      }
    },
    function(err, resp) {
      this.log.info(resp, 'Query result')
    }
  )

  // hemera.act(
  //   {
  //     topic: 'dynamo-store',
  //     cmd: 'removeById',
  //     collection: 'test',
  //     id: "1111"
  //   },
  //   function(err, resp) {
  //     this.log.info(resp, 'Query result')
  //   }
  // )

  // hemera.act(
  //   {
  //     topic: 'dynamo-store',
  //     cmd: 'updateById',
  //     id: "1111",
  //     collection: 'test',
  //     UpdateExpression: "set #city = :city, #country = :country",
  //     ConditionExpression : "#name = :name",
  //     ExpressionAttributeNames: { '#name' : 'name', '#city' : 'city', '#country' : 'country'},
  //     ExpressionAttributeValues: { ':name' : 'John Doe', ':city' : 'Skopje', ':country' : 'Macedonia'}
  //   },
  //   function(err, resp) {
  //     this.log.info(resp, 'Query result')
  //   }
  // )

  // hemera.act(
  //   {
  //     topic: 'dynamo-store',
  //     cmd: 'findById',
  //     collection: 'test',
  //     id: "1111",
  //     ProjectionExpression: "#name,#city",
  //     ExpressionAttributeNames: {"#name" : "name", "#city": "city"}
  //   },
  //   function(err, resp) {
  //     this.log.info(resp, 'Query result')
  //   }
  // )


  // hemera.act(
  //   {
  //     topic: 'dynamo-store',
  //     cmd: 'query',
  //     collection: 'test',
  //     KeyConditionExpression: "#id = :value",
  //     FilterExpression: "#name = :name",
  //     ProjectionExpression: "#name,#city",
  //     ExpressionAttributeNames: {"#name" : "name", "#city": "city", "#id" : "id"},
  //     ExpressionAttributeValues: {":name": "John Doe", ":value" : "1111"}
  //   },
  //   function(err, resp) {
  //     this.log.info(resp, 'Query result')
  //   }
  // )


  // hemera.act(
  //   {
  //     topic: 'dynamo-store',
  //     cmd: 'scan',
  //     collection: 'test',
  //     FilterExpression: "#name = :name",
  //     ProjectionExpression: "#name,#city",
  //     ExpressionAttributeNames: {"#name" : "name", "#city": "city"
  //   },
  //     ExpressionAttributeValues: {":name": "John Doe", ":city" : "Skopje"}
  //   },
  //   function(err, resp) {
  //     this.log.info(resp, 'Query result')
  //   }
  // )


})
