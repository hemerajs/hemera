const SlackBot = require('slackbots')
const Hp = require('hemera-plugin')

exports.plugin = Hp(function hemeraWeb (options, next) {
  const hemera = this
  const topic = 'slackbot'

  const bot = new SlackBot({
    token: options.token,
    name: options.name
  })

  // Gracefully shutdown
  hemera.ext('onClose', (done) => {
    hemera.log.debug('Websocket connection closed!')
    bot.ws.close(done)
  })

  const Joi = hemera.exposition['hemera-joi'].joi
  let subscribed = false

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

  bot.on('start', function () {
    hemera.log.debug('Websocket connection open!')

    hemera.add({
      topic,
      cmd: Joi.any().allow(validMethods).required(),
      params: Joi.array().default([])
    }, function (req, reply) {
      bot[req.cmd].apply(bot, req.params)
      .then((resp) => reply(null, resp))
      .fail((err) => reply(err))
    })

    hemera.add({
      topic,
      cmd: 'subscribe'
    }, function (req, reply) {
      if (subscribed) {
        return reply(null, true)
      }

      bot.on('message', function (data) {
      // all ingoing events https://api.slack.com/rtm
        reply(null, data)
      })

      subscribed = true

      return reply(null, true)
    })

    next()
  })

  bot.on('error', (err) => {
    hemera.log.error(err)
    hemera.fatal()
  })

  bot.on('close', () => {
    hemera.log.info('Websocket connection closed!')
  })
}, '>= 1.3.2')

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
