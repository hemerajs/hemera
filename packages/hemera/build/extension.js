"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class Extension
 */
var Extension = function () {
  function Extension(type, server) {
    _classCallCheck(this, Extension);

    this._stack = [];
    this._type = type;
    this._server = server;
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Extension
   */


  _createClass(Extension, [{
    key: "add",
    value: function add(handler) {
      this._stack.push(handler);
    }

    /**
     *
     *
     * @param {Array<Function>} handlers
     *
     * @memberOf Extension
     */

  }, {
    key: "addRange",
    value: function addRange(handlers) {
      this._stack = this._stack.concat(handlers);
    }
    /**
     *
     *
     * @param {any} cb
     *
     * @memberOf Extension
     */

  }, {
    key: "invoke",
    value: function invoke(ctx, cb) {
      var _this = this;

      var each = function each(item, next, prevValue, i) {
        if (_this._server) {
          var response = ctx._response;
          response.next = next;

          item.call(ctx, ctx._request, response, next, prevValue, i);
        } else {
          item.call(ctx, next, i);
        }
      };

      Extension.serial(this._stack, each, cb.bind(ctx));
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

  }], [{
    key: "serial",
    value: function serial(array, method, callback) {
      if (!array.length) {
        callback();
      } else {
        var i = 0;

        var iterate = function iterate(prevValue) {
          var done = function done(err, value, abort) {
            if (err) {
              callback(err);
            } else if (value && abort) {
              callback(null, value);
            } else {
              i = i + 1;

              if (i < array.length) {
                iterate(value);
              } else {
                callback(null, value);
              }
            }
          };

          method(array[i], done, prevValue, i);
        };

        iterate();
      }
    }
  }]);

  return Extension;
}();

exports.default = Extension;
//# sourceMappingURL=extension.js.map