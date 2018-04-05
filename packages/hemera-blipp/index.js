'use strict'

const Hp = require('hemera-plugin')
const chalk = require('chalk')

function hemeraBlipp(hemera, opts, done) {
  const actions = []
  hemera.ext('onAdd', definition => {
    actions.push({
      hasSpecialProp:
        definition.transport.pubsub ||
        definition.transport.maxMessages ||
        definition.transport.queue,
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
    for (let action of actions) {
      output += `${chalk.green(action.type)}`
      if (action.hasSpecialProp) {
        output += `/${chalk.keyword('orange')('$')}`
      }
      output += `\t${action.pattern.replace(
        /(?::[\w]+|\[:\w+\])/g,
        chalk.gray('$&')
      )}\n`
    }

    if (actions.length > 0) {
      console.log(`🏷️  Actions:`)
      console.log(output)
    }
  })

  function patternToString(pattern) {
    if (typeof pattern === 'string') {
      return pattern
    }
    let sb = []

    for (var key in pattern) {
      sb.push(key + ':' + pattern[key])
    }

    return sb.join(',')
  }

  function hasDollarProp(pattern) {
    for (var key in pattern) {
      if (key.endsWith('$')) {
        return true
      }
    }

    return false
  }

  done()
}

module.exports = Hp(hemeraBlipp, {
  hemera: '^5.0.0',
  name: require('./package.json').name
})
