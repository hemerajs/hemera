'use strict'

const Hp = require('hemera-plugin')

function hemeraKnabe(hemera, opts, done) {
  const dependencies = []

  // add all providers
  hemera.ext('onAdd', definition => {
    if (dependencies.indexOf(definition.pattern.topic) === -1) {
      dependencies.push(definition.pattern.topic)
    }
  })

  // add all consumers
  hemera.ext('onAct', (hemera, next) => {
    if (dependencies.indexOf(hemera.trace$.service) === -1) {
      dependencies.push(hemera.trace$.service)
      if (opts.updates) {
        hemera.sendKnabeReport()
      }
    }
    next()
  })

  hemera.decorate('sendKnabeReport', () => {
    if (dependencies.length === 0) {
      return
    }
    hemera.act(
      Object.assign(
        {
          dependencies,
          node: {
            name: hemera.config.name,
            tag: hemera.config.tag
          }
        },
        opts.pattern
      )
    )
  })

  done()
}

module.exports = Hp(hemeraKnabe, {
  hemera: '>=7',
  /* eslint-disable-next-line */
  name: require('./package.json').name,
  options: {
    updates: false, // notify you about consumers updates
    pattern: {
      topic: 'knabe',
      pubsub$: true
    }
  }
})
