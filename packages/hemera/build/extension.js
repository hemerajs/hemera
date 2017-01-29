'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    key: 'add',
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
    key: 'addRange',
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
    key: 'invoke',
    value: function invoke(ctx, cb) {
      var _this = this;

      var each = function each(item, next, prevValue, i) {

        if (_this._server) {

          var response = new _response2.default(ctx);
          response.next = next;
          var request = new _request2.default(ctx);

          item.call(ctx, request, response, next, prevValue, i);
        } else {

          item.call(ctx, next, prevValue, i);
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
    key: 'serial',
    value: function serial(array, method, callback) {

      if (!array.length) {

        callback();
      } else {
        (function () {

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
        })();
      }
    }
  }]);

  return Extension;
}();

module.exports = Extension;
//# sourceMappingURL=extension.js.map