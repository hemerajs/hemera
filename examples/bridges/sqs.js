'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraSQS = require('./../../packages/hemera-sqs')

const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(hemeraSQS)

hemera.ready(() => {
  const params = {
    DelaySeconds: 10,
    MessageAttributes: {
      'Title': {
        DataType: 'String',
        StringValue: 'The Whistler'
      },
      'Author': {
        DataType: 'String',
        StringValue: 'John Grisham'
      },
      'WeeksOn': {
        DataType: 'Number',
        StringValue: '6'
      }
    },
    MessageBody: 'Information about current NY Times fiction bestseller for week of 12/11/2016.',
    QueueUrl: 'SQS_QUEUE_URL'
  }

  hemera.act({
    topic: 'sqs',
    cmd: 'sendMessage',
    params
  }, function (err, resp) {
    this.log.info(resp || err)
  })
})
