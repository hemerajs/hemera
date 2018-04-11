'use strict'

const Hp = require('hemera-plugin')

function hemeraKnabe(hemera, opts, done) {
  let dependencies = []

  hemera.ext('onAdd', definition => {
    if (dependencies.indexOf(definition.pattern.topic) === -1) {
      dependencies.push(definition.pattern.topic)
    }
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
  hemera: '^5.0.0',
  name: require('./package.json').name,
  options: {
    pattern: {
      topic: 'knabe',
      pubsub$: true
    }
  }
})
