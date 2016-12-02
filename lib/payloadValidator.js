/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

/**
 * Module Dependencies
 */

const
  Parambulator = require('parambulator')

/**
 * 
 * 
 * @class PayloadValidator
 */
class PayloadValidator {

  /**
   * 
   * 
   * @param {any} msg
   * 
   * @memberOf Logger
   */
  static validate(schema, msg, cb) {

    let paramcheck = Parambulator(schema)
    return paramcheck.validate(msg, (err) => {
      
      cb(err, msg)
    })
  }

}

module.exports = PayloadValidator