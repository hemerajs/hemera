'use strict'

const SnappyJS = require('snappyjs')

exports.plugin = function hemeraSnappy () {
  const hemera = this

  hemera._decoder.decode = (msg) => {
    try {
      return {
        value: JSON.parse(SnappyJS.uncompress(msg))
      }
    } catch (error) {
      return {
        error
      }
    }
  }

  hemera._encoder.encode = (msg) => {
    try {
      return {
        value: SnappyJS.compress(Buffer.from(JSON.stringify(msg)))
      }
    } catch (error) {
      return {
        error
      }
    }
  }
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
