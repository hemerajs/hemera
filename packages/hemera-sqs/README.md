# Hemera-sqs package

[![npm](https://img.shields.io/npm/v/hemera-sqs.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sqs)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [sqs](https://aws.amazon.com/sqs/) with Hemera.

Amazon Simple Queue Service (SQS) is a fast, reliable, scalable, fully managed message queuing service. Amazon SQS lets you decouple the components of a cloud application. Amazon SQS includes standard queues with high throughput and at-least-once processing, and FIFO queues that provide FIFO (first-in, first-out) delivery and exactly-once processing.

## Usage

```js
const hemera = new Hemera(nats)

// Load config by file or environment variables
const configPath = '..config.json'

hemera.use(require('hemera-sqs'), { configPath })
```

# Interface

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

# Documentation

[Amazon SQS Examples](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sqs-examples.html)

# Receive multiple messages

If you want to receive more than one message ensure that you set the `maxMessages$` property to `-1`

# Increase timeout

If you want to enable long pooling ensure that you adjust the `timeout$` property for your use case.
