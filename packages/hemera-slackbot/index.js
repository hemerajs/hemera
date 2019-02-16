'use strict'

const SlackBot = require('slackbots')
const Hp = require('hemera-plugin')
const Joi = require('joi')

function hemeraSlackbot(hemera, opts, done) {
  const topic = 'slackbot'

  const bot = new SlackBot({
    token: opts.token,
    name: opts.name
  })

  let subscribed = false
  let wsConnected = false

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    hemera.log.debug('Websocket connection closed!')
    if (wsConnected) {
      bot.ws.close(done)
    } else {
      done()
    }
  })

  const validMethods = [
    'getChannels',
    'getGroups',
    'getUsers',
    'getChannel',
    'getGroup',
    'getUser',
    'getUserByEmail',
    'getChannelId',
    'getGroupId',
    'getUserId',
    'getChatId',
    'postMessage',
    'updateMessage',
    'postTo',
    'postMessageToUser',
    'postMessageToGroup',
    'postMessageToChannel'
  ]

  validMethods.forEach(method => {
    hemera
      .add({
        topic,
        cmd: method
      })
      .use(validationMiddleware)
      .end(function slackBotAction(req, cb) {
        bot[method](bot, ...req.params)
          .then(resp => cb(null, resp))
          .fail(err => cb(err))
      })
  })

  hemera.add(
    {
      topic,
      cmd: 'subscribe'
    },
    function subscribe(req, reply) {
      if (subscribed) {
        reply(null, true)
        return
      }

      bot.on('message', data => {
        // all ingoing events https://api.slack.com/rtm
        this.reply.next(data)
      })

      subscribed = true

      reply(null, true)
    }
  )

  bot.on('start', function start() {
    hemera.log.debug('Websocket connection open!')
    wsConnected = true
    done()
  })

  bot.on('error', err => {
    hemera.log.error(err)
    hemera.fatal()
  })

  bot.on('close', () => {
    hemera.log.info('Websocket connection closed!')
  })
}

function validationMiddleware(req) {
  return Joi.validate(req.payload.pattern.params, Joi.array().default([]))
}

const plugin = Hp(hemeraSlackbot, {
  hemera: '>=5.0.0-rc.1',
  /* eslint-disable-next-line */
  name: require('./package.json').name
})

module.exports = plugin
