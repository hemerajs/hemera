// 

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Util = require('./util')

class Encoder {

  encode(msg) {

    return Util.stringifyJSON(msg)
  }
}

module.exports = Encoder
