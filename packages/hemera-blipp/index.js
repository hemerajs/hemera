'use strict'

const Hp = require('hemera-plugin')
const chalk = require('chalk')

function hemeraBlipp(hemera, opts, done) {
  const actions = []
  hemera.ext('onAdd', definition => {
    actions.push({
      hasSpecialProp:
        definition.transport.pubsub || definition.transport.maxMessages || definition.transport.queue,
      pattern: patternToString(definition.pattern),
      type: definition.transport.pubsub ? 'PUB' : 'REQ'
    })
  })

  hemera.decorate('blipp', () => {
    if (actions.length === 0) {
      return
    }

    actions.sort((a, b) => a.pattern > b.pattern)

    let output = ''
    for (const action of actions) {
      output += `${chalk.green(action.type)}`
      if (action.hasSpecialProp) {
        output += `/${chalk.keyword('orange')('$')}`
      }
      output += `\t${action.pattern.replace(/(?::[\w]+|\[:\w+\])/g, chalk.gray('$&'))}\n`
    }

    if (actions.length > 0) {
      /* eslint-disable no-console */
      console.log(`🏷️  Actions:`)
      console.log(output)
    }
  })

  function patternToString(pattern) {
    if (typeof pattern === 'string') {
      return pattern
    }
    const sb = []

    for (const key in pattern) {
      sb.push(`${key}:${pattern[key]}`)
    }

    sb.sort()

    return sb.join(',')
  }

  done()
}

module.exports = Hp(hemeraBlipp, {
  hemera: '>=7',
  /* eslint-disable-next-line */
  name: require('./package.json').name
})
