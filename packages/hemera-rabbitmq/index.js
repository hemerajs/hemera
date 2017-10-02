'use strict'

const Hp = require('hemera-plugin')
const Rabbit = require('rabbot')

exports.plugin = Hp(hemeraRabbitmq, '>=1.5.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi'
}

function hemeraRabbitmq (hemera, opts, done) {
  const handlers = []
  const Joi = hemera.joi

  hemera.decorate('rabbitmq', {
    handlers
  })

  Rabbit.configure(opts.rabbitmq).then(function () {
    // Sends all unhandled messages back to the queue.
    Rabbit.nackUnhandled()

    // after this call, any new callbacks attached via handle will be wrapped in a try/catch
    // that nacks the message on an error
    Rabbit.nackOnError()

    function consume (type, cb) {
      if (handlers[type]) {
        return
      }

      const handler = Rabbit.handle(type, function (msg) {
        hemera.act(
          {
            topic: `rabbitmq.${type}`,
            cmd: 'subscribe',
            data: msg.body
          },
          err => {
            if (!err) {
              return msg.ack()
            }

            msg.unack()
          }
        )
      })

      handlers[type] = handler

      cb(null, true)
    }

    hemera.add(
      {
        topic: 'rabbitmq',
        cmd: 'subscribe',
        type: Joi.string().required()
      },
      function (req, cb) {
        consume(req.type, cb)
      }
    )

    hemera.add(
      {
        topic: 'rabbitmq',
        cmd: 'publish',
        exchange: Joi.string().required(),
        type: Joi.string().required(),
        data: Joi.object().required()
      },
      function (req, cb) {
        Rabbit.publish(req.exchange, {
          type: req.type,
          body: req.data
        })
          .then(function () {
            cb(null, true)
          })
          .catch(cb)
      }
    )

    done()
  })
}
