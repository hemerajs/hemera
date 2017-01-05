// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Util = require('./util')

class Decoder {

  decode(msg: any) {

    return Util.parseJSON(msg)
  }
}

module.exports = Decoder
