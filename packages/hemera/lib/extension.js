// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Response from './response'
import Request from './request'

/**
 * @class Extension
 */
class Extension {

  _stack: Array<Function> ;
  _type: string;
  _server: boolean;

  constructor(type: string, server? : boolean) {

    this._stack = []
    this._type = type
    this._server = server
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Extension
   */
  add(handler: Function) {

    this._stack.push(handler)

  }

  /**
   *
   *
   * @param {Array<Function>} handlers
   *
   * @memberOf Extension
   */
  addRange(handlers: Array<Function> ) {

    this._stack = this._stack.concat(handlers)

  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Extension
   */
  invoke(ctx: Hemera, cb: Function) {

    const each = (item, next, prevValue, i) => {

      if (this._server) {

        const response = new Response(ctx)
        response.next = next
        const request = new Request(ctx)

        item.call(ctx, request, response, next, prevValue, i);
      } else {

        item.call(ctx, next, prevValue, i);
      }

    }

    Extension.serial(this._stack, each, cb.bind(ctx))

  }
  /**
   *
   *
   * @param {Array<Function>} array
   * @param {Function} method
   * @param {Function} callback
   *
   * @memberOf Extension
   */
  static serial(array: Array<Function> , method: Function, callback: Function) {

    if (!array.length) {

      callback()
    } else {

      let i = 0;

      const iterate = function (prevValue) {

        const done = function (err, value, abort) {

          if (err) {

            callback(err)
          } else if (value && abort) {

            callback(null, value)
          } else {

            i = i + 1

            if (i < array.length) {

              iterate(value)
            } else {

              callback(null, value)
            }
          }
        }

        method(array[i], done, prevValue, i)
      }

      iterate()
    }
  }
}

module.exports = Extension
