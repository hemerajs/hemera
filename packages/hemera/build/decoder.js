/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 * Based on https://github.com/mcollina/fast-json-parse
 */

'use strict'

class Decoder {

  static decode(msg) {

    return Parse(msg)
  }
}

function Parse(data) {

  if (!(this instanceof Parse)) {
    return new Parse(data)
  }

  this.error = null
  this.value = null

  try {

    this.value = JSON.parse(data)
  } catch (error) {

    this.error = error
  }
}

module.exports = Decoder
