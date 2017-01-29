'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Response
 */
var Response = function () {

  /**
   * Creates an instance of Response.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Response
   */
  function Response(ctx) {
    _classCallCheck(this, Response);

    this.ctx = ctx;
  }

  /**
   *
   *
   * @param {*} value
   *
   * @memberOf Response
   */


  _createClass(Response, [{
    key: 'end',
    value: function end(value) {

      if (value instanceof Error) {

        if (_lodash2.default.isFunction(this.next)) {
          this.next(value);
        }
      } else {

        if (_lodash2.default.isFunction(this.next)) {
          this.next(null, value, true);
        }
      }
    }

    /**
     *
     *
     * @param {*} value
     *
     * @memberOf Response
     */

  }, {
    key: 'send',
    value: function send(value) {

      if (value instanceof Error) {

        if (_lodash2.default.isFunction(this.next)) {
          this.next(value);
        }
      } else {

        if (_lodash2.default.isFunction(this.next)) {
          this.next(null, value);
        }
      }
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf Response
     */

  }, {
    key: 'payload',
    get: function get() {

      return this.ctx._response.value;
    }

    /**
     *
     *
     *
     * @memberOf Response
     */
    ,
    set: function set(value) {

      this.ctx._response.value = value;
    }

    /**
     *
     *
     *
     * @memberOf Response
     */

  }, {
    key: 'error',
    set: function set(error) {

      this.ctx._response.error = error;
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf Response
     */
    ,
    get: function get() {

      return this.ctx._response.error;
    }
  }]);

  return Response;
}();

module.exports = Response;
//# sourceMappingURL=response.js.map