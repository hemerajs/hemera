'use strict'

const Hp = require('hemera-plugin')
const Nodemailer = require('nodemailer')

exports.plugin = Hp(hemeraEmail, '>=1.5.0')
exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi',
  transport: {
    jsonTransport: true // for debugging
  }
}

function hemeraEmail(hemera, opts, done) {
  const topic = 'mail'
  const Joi = hemera.joi
  const transporter = Nodemailer.createTransport(opts.transport)

  hemera.add(
    {
      topic,
      cmd: 'send',
      message: Joi.object()
        .keys({
          from: Joi.string().required(),
          to: Joi.string().required(),
          subject: Joi.string().required(),
          text: Joi.string().optional(),
          html: Joi.string().optional(),
          bcc: Joi.string().optional(),
          cc: Joi.string().optional()
        })
        .required()
    },
    function(req, reply) {
      transporter.sendMail(req.message, (err, info) => {
        if (err) {
          this.log.error(err, 'Could not send email!')
          return reply()
        }

        this.log.debug('Message %s sent %s', info.messageId, info.response)

        reply(null, {
          envelope: info.envelope,
          messageId: info.messageId
        })
      })
    }
  )

  done()
}
