'use strict'

const Hp = require('hemera-plugin')

function hemeraStats(hemera, opts, done) {
  const topic = 'stats'

  function collectActionStats() {
    const info = {
      app: hemera.config.name
    }

    const list = hemera.list()
    info.ts = Date.now()
    info.actions = list.map(a => {
      const schema = {}

      // only for joi schemas
      for (var key in a.schema) {
        if (a.schema.hasOwnProperty(key)) {
          var element = a.schema[key]
          if (element.isJoi) {
            schema[key] = {
              description: element._description,
              notes: element._notes,
              tags: element._tags,
              default: element._flags.default,
              required: element._flags.presence === 'required',
              examples: element._examples
            }
          }
        }
      }

      return {
        pattern: a.pattern,
        schema: schema
      }
    })

    return info
  }

  function collectProcessInfo() {
    const info = {
      app: hemera.config.name,
      eventLoopDelay: hemera.load.eventLoopDelay,
      heapUsed: hemera.load.heapUsed,
      rss: hemera.load.rss,
      nodeEnv: process.env.NODE_ENV,
      uptime: process.uptime(),
      ts: Date.now()
    }
    return info
  }

  hemera.decorate('sendProcStats', pattern => {
    return hemera.act(
      Object.assign(
        {
          pubsub$: true,
          stats: collectProcessInfo()
        },
        pattern
      )
    )
  })

  hemera.decorate('sendActionStats', pattern => {
    return hemera.act(
      Object.assign(
        {
          pubsub$: true,
          stats: collectActionStats()
        },
        pattern
      )
    )
  })

  hemera.add(
    {
      topic,
      cmd: 'processInfo',
      pubsub$: true
    },
    function(resp, cb) {
      cb(null, collectProcessInfo())
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'registeredActions',
      pubsub$: true
    },
    function(resp, cb) {
      cb(null, collectActionStats())
    }
  )

  done()
}

const plugin = Hp(hemeraStats, {
  hemera: '>=5.0.0-rc.1',
  name: require('./package.json').name
})

module.exports = plugin
