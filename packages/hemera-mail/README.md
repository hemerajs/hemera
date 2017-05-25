# Hemera-mail package

[![npm](https://img.shields.io/npm/v/hemera-mail.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mail)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to mail via SMTP in Hemera. It's use [Nodemailer](https://nodemailer.com) as client library. The parameters are passed one-to-one so look in the nodemailer documentation if you want to
configure something.

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const nats = require('nats')
const HemeraJoi = require('hemera-joi')
const HemeraMail = require('hemera-mail')
const hemera = new Hemera(nats)

hemera.use(HemeraJoi)
hemera.use(HemeraMail, {
  // use here the nodemailer transport plugin of your choice, default is jsonTransport
})

hemera.ready(() => {

  const message = {
    from: 'sender@server.com',
    to: 'receiver@sender.com',
    subject: 'Message title',
    text: 'Plaintext version of the message',
    html: '<p>HTML version of the message</p>'
  }

  hemera.act({
    topic: 'mail',
    cmd: 'send',
    message
  }, function (err, resp) {

    this.log.info('Result', resp)
  })
})

```

### Requirements
- Node.js 6+

### How to add attachments ?

As long as your content TEXT, HTML is very small (A typical 80-word plain text message is around 10 KB.) it's no problem to transfer it over NATS. Transfering big files in a distributed system is in general an anti-pattern because it will affect the latency of your network and can result in cascading failures. In practice, we recommend to create an API Gateway which is resonsible to handle file uploads. The files can be stored in a distributed object storage like Amazon S3 or opensource alternatives [Rook](https://rook.io/), [Minio](https://docs.minio.io/). The developer would only work with IDs, Urls.

Lots of mail services are providing an interface to manage email templates this is a great feature because you don't have to resend them on every mail. In line with the motto "Buy it and stick to your business".
