'use strict'

const Web = require('./lib')

exports.plugin = function hemeraWeb (options) {
  const hemera = this
  new Web(hemera, options).listen()
}

exports.options = {
  url: 3000,
  pattern: {}
}

exports.attributes = {
  pkg: require('./package.json')
}
