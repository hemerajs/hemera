'use strict'

const semver = require('semver')
const console = require('console')

function plugin(fn, version) {
  if (typeof fn !== 'function') {
    throw new TypeError(
      `hemera-plugin expects a function, instead got a '${typeof fn}'`
    )
  }

  if (version) {
    if (typeof version !== 'string') {
      throw new TypeError(
        `hemera-plugin expects a version string as second parameter, instead got '${typeof version}'`
      )
    }

    let hemeraVersion
    try {
      hemeraVersion = require('nats-hemera/package.json').version
    } catch (_) {
      console.info('hemera not found, proceeding anyway')
    }

    if (hemeraVersion && !semver.satisfies(hemeraVersion, version)) {
      throw new Error(
        `hemera-plugin - expected '${version}' nats-hemera version, '${hemeraVersion}' is installed`
      )
    }
  }

  return fn
}

plugin[Symbol.for('isHemera')] = true

module.exports = plugin
