'use strict'

const SlackBot = require('slackbots')
const Hp = require('hemera-plugin')

function hemeraSlackbot(hemera, opts, done) {
  const topic = 'slackbot'

  const bot = new SlackBot({
    token: opts.token,
    name: opts.name
  })

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    hemera.log.debug('Websocket connection closed!')
    if (wsConnected) {
      bot.ws.close(done)
    } else {
      done()
    }
  })

  const Joi = hemera.joi
  let subscribed = false
  let wsConnected = false

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
    hemera.add(
      {
        topic,
        cmd: method,
        params: Joi.array().default([])
      },
      function(req, reply) {
        bot[method]
          .apply(bot, req.params)
          .then(resp => reply(null, resp))
          .fail(err => reply(err))
      }
    )
  })

  hemera.add(
    {
      topic,
      cmd: 'subscribe'
    },
    function(req, reply) {
      if (subscribed) {
        return reply(null, true)
      }

      bot.on('message', function(data) {
        // all ingoing events https://api.slack.com/rtm
        reply(null, data)
      })

      subscribed = true

      return reply(null, true)
    }
  )

  bot.on('start', function() {
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

const plugin = Hp(hemeraSlackbot, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi'
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
