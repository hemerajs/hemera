# Hemera-sqs package

[![npm](https://img.shields.io/npm/v/hemera-sqs.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sqs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [sqs](https://aws.amazon.com/sqs/) with Hemera.

Amazon Simple Queue Service (SQS) is a fast, reliable, scalable, fully managed message queuing service. Amazon SQS lets you decouple the components of a cloud application. Amazon SQS includes standard queues with high throughput and at-least-once processing, and FIFO queues that provide FIFO (first-in, first-out) delivery and exactly-once processing.

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const HemeraSQS = require('hemera-sqs')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

// Load config by file or environment variables
const configPath = '..config.json'

hemera.use(HemeraSQS, { configPath })

hemera.ready(() => {

  hemera.act({
    topic: 'sqs',
    cmd: 'sendMessage',
    params: { ... } // See AWS documentation
  }, function (err, resp) {
    this.log.info(resp || err)
  })
})
```

## Interface

* [sqs queue](#sqs-queue)
  * [List queues](#listQueue)
  * [Create queue](#createQueue)
  * [Delete queue](#deleteQueue)
  * [Get queue url](#getQueueUrl)
  * [Set queue attributes](#setQueueAttributes)
* [sqs messaging](#sqs-messaging)
  * [Send message](#sendMessage)
  * [Receive message](#receiveMessage)
  * [Delete message](#deleteMessage)
  * [Change message visibility](#changeMessageVisibility)

### Documentation
[Amazon SQS Examples](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sqs-examples.html)

### Long Polling

#### Receive multiple messages
If you wanto to receive more than one message ensure that you set the `maxMessages$` property to `-1`

#### Increase timeout 
If you want to enable long pooling ensure that you increase the `timeout$` property to don't run into a timeout error
