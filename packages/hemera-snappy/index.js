'use strict'

const SnappyJS = require('snappyjs')
const Buffer = require('safe-buffer').Buffer
const Hp = require('hemera-plugin')

exports.plugin = Hp(function hemeraSnappy () {
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
        value: SnappyJS.compress(new Buffer(JSON.stringify(msg)))
      }
    } catch (error) {
      return {
        error
      }
    }
  }
})

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
