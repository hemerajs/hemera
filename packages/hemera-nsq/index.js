'use strict'

const Hp = require('hemera-plugin')
const Nsq = require('nsqjs')

exports.plugin = Hp(hemeraNsqStore, '>=2.0.0-0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi'
}

function hemeraNsqStore(hemera, opts, done) {
  const readers = {}

  hemera.decorate('nsq', {
    readers
  })

  const Joi = hemera.joi

  function consume(subject, channel, cb) {
    // only one reader per topic channel combination
    if (readers[subject + channel]) {
      return cb(null, true)
    }

    var reader = new Nsq.Reader(subject, channel, opts.nsq.reader)

    reader.connect()

    reader.on(Nsq.Reader.NSQD_CONNECTED, function(host, port) {
      hemera.log.info('Reader connected to %s:%s', host, port)
      cb(null, true)
    })

    reader.on(Nsq.Reader.DISCARD, function(msg) {
      hemera.log.warn(msg, 'Message was discarded')
    })

    reader.on(Nsq.Reader.ERROR, function(err) {
      hemera.log.error(err, 'Reader error')
      cb(err)
      hemera.fatal() // Let it crash and restart
    })

    reader.on(Nsq.Reader.MESSAGE, function(msg) {
      /*
       * Forward all message of the NSQ topic/channel to the NATS subscriber
       */
      hemera.act(
        {
          topic: `nsq.${subject}.${channel}`,
          cmd: 'subscribe',
          data: msg.json()
        },
        err => {
          if (!err) {
            return msg.finish()
          }

          msg.requeue()
        }
      )
    })

    readers[subject + channel] = reader
  }

  // only one writer for this service
  var w = new Nsq.Writer(
    opts.nsq.writer.url,
    opts.nsq.writer.port,
    opts.nsq.writer.options
  )

  w.connect()

  w.on('error', function(err) {
    hemera.log.error(err, 'Writer error')
    hemera.fatal() // Let it crash and restart
  })

  w.on('closed', function() {
    hemera.log.warn('Writer closed')
  })

  w.on('ready', function() {
    hemera.log.info('Writer is ready')

    /*
     * Publish a message to a NSQ topic
     */
    hemera.add(
      {
        topic: 'nsq',
        cmd: 'publish',
        subject: Joi.string().required(),
        data: Joi.object().required()
      },
      function(req, cb) {
        w.publish(req.subject, req.data, function(err) {
          if (err) {
            return cb(err)
          }

          cb(null, true)
        })
      }
    )

    /*
     * Create NSQ subscriber
     */
    hemera.add(
      {
        topic: 'nsq',
        cmd: 'subscribe',
        subject: Joi.string().required(),
        channel: Joi.string().required()
      },
      function(req, cb) {
        consume(req.subject, req.channel, cb)
      }
    )

    done()
  })
}
