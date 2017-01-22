// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Items from 'items'

/**
 * @class Ext
 */
class Ext {

  _handler: Array<Function>;
  _type: string;

  constructor(type: string) {

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
  add(handler: Function) {

    this._handler.push(handler)

  }

  /**
   *
   *
   * @param {Array<Function>} handlers
   *
   * @memberOf Ext
   */
  addRange(handlers: Array<Function>) {

    this._handler = this._handler.concat(handlers)

  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Ext
   */
  invoke(ctx: any, cb: Function) {

    const each = (ext, next) => {

      const bind = ctx

      ext.call(bind, next);
    }

    Items.serial(this._handler, each, cb.bind(ctx))

  }
}

module.exports = Ext
