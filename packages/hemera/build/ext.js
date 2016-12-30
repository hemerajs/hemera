// 

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const Items = require('items')

/**
 * @class Ext
 */
class Ext {

  
  

  constructor(type) {

    this._handler = []
    this._type = type
  }
  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Ext
   */
  subscribe(handler) {

    this._handler.push(handler)

  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Ext
   */
  invoke(ctx, cb) {

    const each = (ext, next) => {

      const bind = ctx

      ext.call(bind, next);
    };

    Items.serial(this._handler, each, cb.bind(ctx))

  }
}

module.exports = Ext
