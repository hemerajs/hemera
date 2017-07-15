'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraJoi = require('./../../packages/hemera-joi')
const hemeraSlackbot = require('./../../packages/hemera-slackbot')

const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true
})

hemera.use(hemeraJoi)
hemera.use(hemeraSlackbot, {
  token: '<your-token>',
  name: 'hemeraBot'
})

hemera.ready(() => {
  hemera.act({
    topic: 'slackbot',
    cmd: 'postMessageToChannel',
    params: [
      'general', // Channel
      'Hello bob!', // Message
      {
        icon_emoji: ':cat:'
      }
    ]
  }, function (err, resp) {
    console.log(err, resp)
  })
})
