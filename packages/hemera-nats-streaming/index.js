'use strict'

const Hp = require('hemera-plugin')
const SafeStringify = require('fast-safe-stringify')
const SafeParse = require('json-parse-safe')
const Nats = require('node-nats-streaming')

exports.plugin = Hp(function hemeraNatsStreaming (options, next) {
  const hemera = this
  const topic = 'nats-streaming'
  const Joi = hemera.exposition['hemera-joi'].joi
  const DuplicateSubscriberError = hemera.createError('DuplicateSubscriber')
  const ParsingError = hemera.createError('ParsingError')
  const NotAvailableError = hemera.createError('NotAvailable')
  const stan = Nats.connect(options.clusterId, options.clientId, options.opts)
  const subList = {}

  hemera.ext('onClose', (next) => {
    hemera.log.debug('Stan closing ...')
    stan.close()
    next()
  })

  stan.on('error', (err) => {
    hemera.log.error(err)
    hemera.fatal()
  })

  stan.on('connect', function () {
    /**
     * Publish a message over NATS-Streaming server
     */
    hemera.add({
      topic,
      cmd: 'publish',
      subject: Joi.string().required(),
      data: Joi.alternatives().try(Joi.object(), Joi.array())
    }, function (req, reply) {
      function handler (err, guid) {
        if (err) {
          reply(err)
        } else {
          reply(null, guid)
        }
      }

      stan.publish(req.subject, SafeStringify(req.data), handler)
    })

    /**
     * Create a subscription on the NATS-Streaming server
     * All options are available expect manual acknowledgement because we use it as a proxy
     */
    hemera.add({
      topic,
      cmd: 'subscribe',
      subject: Joi.string().required(),
      queue: Joi.string().optional(),
      options: Joi.object().keys({
        setStartWithLastReceived: Joi.boolean(), // Subscribe starting with the most recently published value
        setDeliverAllAvailable: Joi.boolean(), // Receive all stored values in order
        setStartAtSequence: Joi.number().integer(), // Receive all messages starting at a specific sequence number
        setStartTime: Joi.date().iso(), // Subscribe starting at a specific time
        setStartAtTimeDelta: Joi.number().integer(),
        setDurableName: Joi.string(), // Create a durable subscription
        setMaxInFlight: Joi.number().integer(), // the maximum number of outstanding acknowledgements
        setManualAckMode: Joi.boolean().default(true),
        setAckWait: Joi.number().integer() // if an acknowledgement is not received within the configured timeout interval, NATS Streaming will attempt redelivery of the message (default 30 seconds)
      }).default()
    }, function (req, reply) {
      // avoid multiple subscribers for the same subject
      if (subList[req.subject]) {
        reply(new DuplicateSubscriberError(`Subscription for subject "${req.subject}" is already active`))
        return
      }

      const opts = stan.subscriptionOptions()

      for (var option in req.options) {
        if (req.options[option] !== undefined) {
          opts[option](req.options[option])
        }
      }

      this.log.debug(opts, 'Subscription options')

      const sub = stan.subscribe(req.subject, req.queue, opts)
      subList[req.subject] = sub

      // signal that subscription was created
      reply(null, { created: true, subject: req.subject, opts })

      sub.on('message', (msg) => {
        const result = SafeParse(msg.getData())
        if (result.error) {
          const error = new ParsingError(`Message could not be parsed as JSON`)
                          .cause(result.error)
          reply(error)
        } else {
          const data = {
            sequence: msg.getSequence(),
            message: result.value
          }
          reply(null, data)
          msg.ack()
        }
      })
    })

    /**
     * Suspends durable subscription
     * If you call `subscribe` again the subscription will be resumed
     */
    hemera.add({
      topic,
      cmd: 'suspend',
      subject: Joi.string().required()
    }, function (req, reply) {
      if (subList[req.subject]) {
        subList[req.subject].close()
        delete subList[req.subject]
        reply(null, true)
      } else {
        reply(new NotAvailableError(`Subscription "${req.subject}" is not available`))
      }
    })

    /**
     * Unsubscribe an active subscription
     */
    hemera.add({
      topic,
      cmd: 'unsubscribe',
      subject: Joi.string().required()
    }, function (req, reply) {
      if (subList[req.subject]) {
        subList[req.subject].unsubscribe()
        delete subList[req.subject]
        reply(null, true)
      } else {
        reply(new NotAvailableError(`Subscription "${req.subject}" is not available`))
      }
    })

    next()
  })
})

exports.options = {
  payloadValidator: 'hemera-joi',
  opts: {} // object with NATS/STAN options
}

exports.attributes = {
  pkg: require('./package.json')
}
