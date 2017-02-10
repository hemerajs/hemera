'use strict'

const Rabbit = require('rabbot');
const HemeraJoi = require('hemera-joi')

exports.plugin = function hemeraRabbitmq(options) {

  const hemera = this

  hemera.use(HemeraJoi)

  const handlers = []
  const Joi = hemera.exposition['hemera-joi'].joi

  hemera.expose('handlers', handlers)

  Rabbit.configure(options.rabbitmq).then(function () {

    //Sends all unhandled messages back to the queue.
    Rabbit.nackUnhandled()

    // after this call, any new callbacks attached via handle will be wrapped in a try/catch
    // that nacks the message on an error
    Rabbit.nackOnError()

    function consume(type) {

      if (handlers[type]) {
        return
      }

      const handler = Rabbit.handle(type, function (msg) {

        hemera.act({
          topic: `rabbitmq.${type}`,
          cmd: 'subscribe',
          data: msg.body
        }, (err) => {

          if (!err) {
            return msg.ack();
          }

          msg.unack()

        })

      })

      handlers[type] = handler

    }

    hemera.add({
      topic: 'rabbitmq',
      cmd: 'publish',
      exchange: Joi.string().required(),
      type: Joi.string().required(),
      data: Joi.object().required()
    }, function (req, cb) {

      consume(req.type)

      Rabbit.publish(req.exchange, {
        type: req.type,
        body: req.data
      }).then(function () {

        cb(null, true)
      })
      .catch(cb)
    })

  })


}

exports.options = {
  payloadValidator: 'hemera-joi'
}

exports.attributes = {
  name: 'hemera-rabbitmq',
  dependencies: ['hemera-joi']
}
