'use strict'

const Hp = require('hemera-plugin')
const Nsq = require('nsqjs')

exports.plugin = Hp(hemeraNsq, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi',
  nsqReader: {},
  nsqWriter: {}
}

function hemeraNsq(hemera, opts, done) {
  const readers = new Map()
  hemera.decorate('nsq', {
    readers
  })

  function consume(subject, channel, reply) {
    const readerKey = `${subject}.${channel}`
    // only one reader per topic channel combination
    if (readers.has(readerKey)) {
      return reply()
    }

    // if not exist, create Reader instance
    const reader = new Nsq.Reader(subject, channel, opts.nsqReader)

    reader.connect()

    reader.on(Nsq.Reader.NSQD_CONNECTED, (host, port) => {
      hemera.log.info('NSQ Reader connected to %s:%s', host, port)
      reply()
    })

    reader.on(Nsq.Reader.DISCARD, msg => {
      hemera.log.warn(msg, 'NSQ Message was discarded')
    })

    reader.on(Nsq.Reader.ERROR, err => {
      hemera.log.error(err, 'NSQ Reader error')
      reply(err)
      hemera.fatal() // Let it crash and restart
    })

    reader.on(Nsq.Reader.MESSAGE, msg => {
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

    readers.set(readerKey, reader)
  }

  // only one writer for this service
  const writer = new Nsq.Writer(
    opts.nsqWriter.host,
    opts.nsqWriter.port,
    opts.nsqWriter.options
  )

  writer.connect()

  writer.on('error', err => {
    hemera.log.error(err, 'NSQ Writer error')
    hemera.fatal() // Let it crash and restart
  })

  writer.on('closed', () => {
    hemera.log.warn('NSQ Writer closed')
  })

  writer.on('ready', () => {
    hemera.log.info('NSQ Writer is ready')

    /*
     * Publish a message to a NSQ topic
     */
    hemera.add(
      {
        topic: 'nsq',
        cmd: 'publish'
      },
      function(req, reply) {
        writer.publish(req.subject, req.data, err => {
          if (err) {
            return reply(err)
          }

          reply()
        })
      }
    )

    /*
     * Create NSQ subscriber
     */
    hemera.add(
      {
        topic: 'nsq',
        cmd: 'subscribe'
      },
      function(req, reply) {
        consume(req.subject, req.channel, reply)
      }
    )

    done()
  })

  // Gracefully shutdown
  hemera.ext('onClose', (hemera, done) => {
    writer.close()
    readers.forEach(reader => {
      reader.close()
    })

    hemera.log.debug('NSQ connections closed!')
    done()
  })
}
