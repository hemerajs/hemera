'use strict'

const Hp = require('hemera-plugin')
const Joi = require('@hapi/joi')
const Nodemailer = require('nodemailer')

function hemeraEmail(hemera, opts, done) {
  const topic = 'mail'
  const transporter = Nodemailer.createTransport(opts.transport)

  hemera
    .add({
      topic,
      cmd: 'send'
    })
    .use(validationMiddlware)
    .end(function hemeraMailAction(req, cb) {
      transporter.sendMail(req.message, (err, info) => {
        if (err) {
          this.log.error(err, 'Email could not be send!')
          cb(err)
          return
        }
        this.log.debug('Message %s sent %s', info.messageId, info.response)
        cb(null, {
          envelope: info.envelope,
          messageId: info.messageId
        })
      })
    })

  done()
}

function validationMiddlware(req) {
  return Joi.validate(
    req.payload.pattern.message,
    Joi.object()
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
  )
}

const plugin = Hp(hemeraEmail, {
  hemera: '>=5.0.0-rc.1',
  // eslint-disable-next-line global-require
  name: require('./package.json').name,
  options: {
    transport: {
      jsonTransport: true // for debugging
    }
  }
})

module.exports = plugin
