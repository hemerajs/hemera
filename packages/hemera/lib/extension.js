/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class Extension
 */
class Extension {

  constructor (type, server) {
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
  add (handler) {
    this._stack.push(handler)
  }

  /**
   *
   *
   * @param {Array<Function>} handlers
   *
   * @memberOf Extension
   */
  addRange (handlers) {
    this._stack = this._stack.concat(handlers)
  }
  /**
   *
   *
   * @param {any} cb
   *
   * @memberOf Extension
   */
  invoke (ctx, cb) {
    const each = (item, next, prevValue, i) => {
      if (this._server) {
        const response = ctx._response
        response.next = next

        item.call(ctx, ctx._request, response, next, prevValue, i)
      } else {
        item.call(ctx, next, i)
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
  static serial (array, method, callback) {
    if (!array.length) {
      callback()
    } else {
      let i = 0

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
