'use strict'

const semver = require('semver')

function plugin (fn, version) {
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

    const hemeraVersion = require('nats-hemera/package.json').version
    if (!semver.satisfies(hemeraVersion, version)) {
      throw new Error(
        `hemera-plugin - expected '${version}' nats-hemera version, '${hemeraVersion}' is installed`
      )
    }
  }

  return fn
}

module.exports = plugin
