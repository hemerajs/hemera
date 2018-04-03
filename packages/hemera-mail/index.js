'use strict'

const Hp = require('hemera-plugin')
const Joi = require('joi')
const Nodemailer = require('nodemailer')

function hemeraEmail(hemera, opts, done) {
  const topic = 'mail'
  const transporter = Nodemailer.createTransport(opts.transport)

  hemera
    .add({
      topic,
      cmd: 'send'
    })
    .use(req => validate(req.payload.pattern.message))
    .end(action)

  function action(req, cb) {
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
  }

  done()
}

function validate(payload) {
  return Joi.validate(
    payload,
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
  name: require('./package.json').name,
  options: {
    transport: {
      jsonTransport: true // for debugging
    }
  }
})

module.exports = plugin
