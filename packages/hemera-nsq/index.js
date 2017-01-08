'use strict'

const Nsq = require('nsqjs');
const HemeraParambulator = require('hemera-parambulator')

exports.plugin = function hemeraNsqStore(options) {

  const hemera = this
  const readers = {}

  hemera.use(HemeraParambulator)

  /**
   * Create a reader which emits all events to the next NATS subscriber
   */
  function read(subject, channel) {

    if (readers[subject + channel]) {

      return
    }

    var reader = new Nsq.Reader(subject, channel, options.nsq.reader)

    reader.connect();

    reader.on('discard', function (msg) {

      hemera.log.warn(msg, 'Message was discarded')

    })

    reader.on('error', function (err) {

      hemera.log.error(err, 'Reader error')
      hemera.fatal() //Let it crash and restart

    })

    reader.on('message', function (msg) {

      hemera.act({
        topic: 'nsq',
        cmd: 'read',
        subject: subject,
        channel: channel,
        data: msg.json()
      }, (err) => {

        if (!err) {
          return msg.finish()
        }

        msg.requeue()

      })

    })

    readers[subject + channel] = reader

  }

  var w = new Nsq.Writer(options.nsq.writer.url, options.nsq.writer.port, options.nsq.writer.options)

  w.connect()

  w.on('error', function (err) {

    hemera.log.error(err, 'Writer error')
    hemera.fatal() //Let it crash and restart
  })

  w.on('closed', function () {

    hemera.log.warn('Writer closed')
  })

  w.on('ready', function () {

    hemera.log.info('Writer is ready')

    hemera.add({
      topic: 'nsq',
      cmd: 'publish',
      subject: {
        required$: true,
        type$: 'string'
      },
      channel: {
        required$: true,
        type$: 'string'
      },
      data: {
        required$: true
      },
    }, function (req, cb) {

      w.publish(req.subject, req.data, function (err) {

        if (err) {
          return cb(err)
        }

        read(req.subject, req.channel)

        cb(null, true)

      })
    })

  })

}

exports.options = {
  reader: null,
  writer: null
}

exports.attributes = {
  name: 'hemera-nsq'
}
