// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Util from './util'

/**
 * @class Ext
 */
class Ext {

  _stack: Array<Function>;
  _type: string;

  constructor(type: string) {

    this._stack = []
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

    this._stack.push(handler)

  }

  /**
   *
   *
   * @param {Array<Function>} handlers
   *
   * @memberOf Ext
   */
  addRange(handlers: Array<Function> ) {

    this._stack = this._stack.concat(handlers)

  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Ext
   */
  invoke(ctx: Hemera, cb: Function) {

    const each = (item, next, i) => {

      const bind = ctx

      item.call(bind, next, i);
    }

    Util.serial(this._stack, each, cb.bind(ctx))

  }
}

module.exports = Ext
