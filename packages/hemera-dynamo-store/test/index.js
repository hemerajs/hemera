'use strict'

const Hemera = require('./../../hemera')
const Nats = require('nats')
const HemeraDynamoStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
var DynamoDbLocal = require('dynamodb-local');
const AWS = require('aws-sdk')

const expect = Code.expect

describe('Hemera-dynamo-store', function () {
  let PORT = 4222;
  var dynamoLocalPort = 8000;
  var authUrl = 'nats://localhost:' + PORT
  const endpoint = 'http://localhost:' + dynamoLocalPort;

  let server
  let hemera
  let testTable = 'testTable'

  const params = {
    TableName: testTable,
    KeySchema: [{
      AttributeName: "id",
      KeyType: "HASH"
    }],
    AttributeDefinitions: [{
      AttributeName: "id",
      AttributeType: "S"
    }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

   /**
   * Setup table schema
   *
   * @param {any} driver
   * @param {any} cb
   * @returns
   */

function setup(driver, cb) {
  driver.createTable(params, function(err, data){
    if(err){
      console.log("errors occured");
      cb(err)
    } 
    else {
      console.log("Table is created");
      cb(null, data)
    }
  })
}


    before(function(done) {
      server = HemeraTestsuite.start_server(PORT, () => {
        const nats = Nats.connect(authUrl)
        hemera = new Hemera(nats)
        hemera.use(HemeraJoi)
        hemera.use(HemeraDynamoStore, {
            dynamodb: {
                endpoint: 'http://localhost:8000',
                region: 'eu-west-2'
              }
        })
        hemera.ready(() => {
          console.log("Hemera is ready")
          DynamoDbLocal.launch(dynamoLocalPort, null, ['-sharedDb'])
          .then(function() {
            console.log("Dynamo db is active and listen on port: " + dynamoLocalPort);
          setup(hemera.dynamoStore.createDb(), done);
          })
        })
      })
    })

    after(function() {
      hemera.close()
      server.kill()
      DynamoDbLocal.stop(dynamoLocalPort);
    })

    it('create', function(done) {
        hemera.act(
            {
                topic: 'dynamo-store',
                cmd: 'create',
                collection: testTable,
                data: {
                  id: '000001',
                  name: 'Test item is created'
                }
              },
          (err, resp) => {
            expect(err).to.be.not.exists()
            expect(resp.id).to.be.a.string();
            expect(resp.id).to.equal('000001');
            expect(resp.name).to.be.a.string();
            done()
          }
        )
      })



    it('updateById',function(done){
      hemera.act(
        {
          topic: 'dynamo-store',
          cmd: "updateById",
          id: "000001",
          collection: testTable,
          UpdateExpression: "set #city = :city, #country = :country",
          ConditionExpression : "#name = :name",
          ExpressionAttributeNames: { '#name' : 'name', '#city' : 'city', '#country' : 'country'},
          ExpressionAttributeValues: { ':name' : 'Test item is created', ':city' : 'Skopje', ':country' : 'Macedonia'}
        },
        function(err, resp) {
            expect(err).to.be.not.exists()
            expect(resp.Attributes.id).to.be.a.string();
            expect(resp.Attributes.id).to.equal('000001');
            expect(resp.Attributes.city).to.be.a.string();
            expect(resp.Attributes.city).to.equal('Skopje');
            expect(resp.Attributes.country).to.equal('Macedonia');
          done();
        }
      )
    })

    it('findById',function(done){
      hemera.act(
        {
          topic: 'dynamo-store',
          cmd: 'findById',
          collection: testTable,
          id: "000001",
          ProjectionExpression: "#name,#city",
          ExpressionAttributeNames: {"#name" : "name", "#city": "city"}
        },
        function(err, resp) {
            expect(err).to.be.not.exists();
            expect(resp).to.be.a.object();
            expect(resp.name).to.be.a.string();
            expect(resp.name).to.equal('Test item is created');
            expect(resp.city).to.be.a.string();
            expect(resp.city).to.equal('Skopje');
          done();
        }
      )
    })


    it('create-2', function(done) {
      hemera.act(
          {
              topic: 'dynamo-store',
              cmd: 'create',
              collection: testTable,
              data: {
                id: '2',
                name: 'Test is second item that is created',
                city: "Paris",
                country: "France"
              }
            },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp.id).to.be.a.string();
          expect(resp.id).to.equal('2');
          expect(resp.name).to.be.a.string();
          done()
        }
      )
    })


    it('scan', function(done) {
      hemera.act(
          {
              topic: 'dynamo-store',
              cmd: 'scan',
              collection: testTable
            },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp.Items).to.have.length(2);
          expect(resp.Items[0].name).to.equal('Test item is created');
          done()
        }
      )
    })

    it('query', function(done){
      hemera.act(
        {
          topic: 'dynamo-store',
          cmd: 'query',
          collection: testTable,
          KeyConditionExpression: "#id = :id",
          FilterExpression: "#city = :city",
          ProjectionExpression: "#name,#city",
          ExpressionAttributeNames: {"#id" : "id", "#name" : "name", "#city": "city"},
          ExpressionAttributeValues: {":city": "Paris", ":id" : "2"}
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.Items).to.have.length(1);
          expect(resp.Items[0].city).to.equal('Paris');
          done()
        }
      )
    })

    it('removeById', function(done) {
      hemera.act(
        {
          topic: 'dynamo-store',
          cmd: 'removeById',
          collection: testTable,
          id: "2"
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp.Attributes.city).to.equal('Paris');
          done()
        }
      )
    })

})
