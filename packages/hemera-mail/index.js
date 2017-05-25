'use strict'

const Nodemailer = require('nodemailer')

exports.plugin = function hemeraMsgpack (options) {
  const hemera = this
  const topic = 'mail'
  const Joi = hemera.exposition['hemera-joi'].joi
  const transporter = Nodemailer.createTransport(options.transport)

  hemera.add({
    topic,
    cmd: 'send',
    message: Joi.object().keys({
      from: Joi.string().required(),
      to: Joi.string().required(),
      subject: Joi.string().required(),
      text: Joi.string().optional(),
      html: Joi.string().optional(),
      bcc: Joi.string().optional(),
      cc: Joi.string().optional()
    }).required()
  }, function (req, reply) {
    transporter.sendMail(req.message, (err, info) => {
      if (err) {
        this.log.eror(err, 'Could not send email!')
        return reply()
      }

      this.log.debug('Message %s sent %s', info.messageId, info.response)

      reply(null, {
        envelope: info.envelope,
        messageId: info.messageId
      })
    })
  })
}

exports.options = {
  payloadValidator: 'hemera-joi',
  transport: {
    jsonTransport: true // for debugging
  }
}

exports.attributes = {
  dependencies: ['hemera-joi'],
  pkg: require('./package.json')
}
