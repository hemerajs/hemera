'use strict'

const AWS = require('aws-sdk')
const Hp = require('hemera-plugin')

function hemeraSQS(hemera, opts, done) {
  const topic = 'sqs'

  if (opts.configPath) {
    AWS.config.loadFromPath(opts.configPath)
  }

  // Create an SQS service object
  const sqs = new AWS.SQS(opts.sqs)

  /**
   *  QUEUES
   */

  hemera.add(
    {
      topic,
      cmd: 'listQueues'
    },
    function(req, reply) {
      sqs.listQueues(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply({ queueUrls: data.QueueUrls })
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'createQueue'
    },
    function(req, reply) {
      sqs.createQueue(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply({ queueUrl: data.QueueUrl })
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'getQueueUrl'
    },
    function(req, reply) {
      sqs.getQueueUrl(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply({ queueUrl: data.QueueUrl })
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'deleteQueue'
    },
    function(req, reply) {
      sqs.deleteQueue(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply(data)
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'setQueueAttributes'
    },
    function(req, reply) {
      sqs.setQueueAttributes(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply({ queueUrls: data.QueueUrls })
        }
      })
    }
  )

  /**
   * MESSAGING
   */

  hemera.add(
    {
      topic,
      cmd: 'sendMessage'
    },
    function(req, reply) {
      sqs.sendMessage(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply({ id: data.MessageId })
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'receiveMessage'
    },
    function(req, reply) {
      sqs.receiveMessage(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply(data)
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'deleteMessage'
    },
    function(req, reply) {
      sqs.deleteMessage(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply(data)
        }
      })
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'changeMessageVisibility'
    },
    function(req, reply) {
      sqs.changeMessageVisibility(req.params, (err, data) => {
        if (err) {
          this.log.error(err)
          reply(err)
        } else {
          reply(data)
        }
      })
    }
  )

  done()
}

const plugin = Hp(hemeraSQS, {
  hemera: '^3.0.0',
  name: require('./package.json').name,
  options: {
    sqs: {
      apiVersion: '2012-11-05'
    }
  }
})

module.exports = plugin
