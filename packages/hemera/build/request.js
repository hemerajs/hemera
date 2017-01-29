"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class Request
 */
var Request = function () {

  /**
   * Creates an instance of Request.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Request
   */
  function Request(ctx) {
    _classCallCheck(this, Request);

    this.ctx = ctx;
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf Request
   */


  _createClass(Request, [{
    key: "payload",
    get: function get() {

      return this.ctx._request.value;
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf Request
     */
    ,


    /**
     *
     *
     *
     * @memberOf Response
     */
    set: function set(value) {

      this.ctx._request.value = value;
    }

    /**
     *
     *
     *
     * @memberOf Response
     */

  }, {
    key: "error",
    get: function get() {

      return this.ctx._request.error;
    },
    set: function set(error) {

      this.ctx._request.error = error;
    }
  }]);

  return Request;
}();

module.exports = Request;
//# sourceMappingURL=request.js.map