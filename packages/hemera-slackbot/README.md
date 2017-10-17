# Hemera-slackbot
Simple wrapper around [slack-bot-api](https://github.com/mishk0/slack-bot-api) allows you to send messages to slack users, groups and more with hemera. 

[![npm](https://img.shields.io/npm/v/hemera-slackbot.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-slackbot)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

#### Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraSlackbot = require('hemera-slackbot')

const hemera = new Hemera(nats)
hemera.use(hemeraSlackbot, {
  token: '<your-token>', // Add a bot https://my.slack.com/services/new/bot and put the token 
  name: 'myBot'
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
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
})
```

# RTM (Real-time-messaging)

```js
hemera.act({
      topic: 'slackbot',
      cmd: 'subscribe',
      maxMessages$: -1,
    (err, req) => {
      // all ingoing events https://api.slack.com/rtm
  })
```

# API

See [slack-bot-api](https://github.com/mishk0/slack-bot-api#methods) for an overview of all available methods. We pass it one to one.

## Why?

Slack is one of the most popular chat services and provide a great integration for many services. It's no secret that it can improve the flow of information in teams. Be notified of critical system or business errors anytime and anywhere. Emails are annoying!

- An important user has canceled his subscription -> notify me!
- We reached the first 10000 Users -> notify us!
- The server respond with 500 -> notify emergency group!
- ...

# Credits
Idea by [OsoianMarcel](https://github.com/OsoianMarcel)
