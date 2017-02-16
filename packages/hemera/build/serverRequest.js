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
 * @class ServerRequest
 */
var ServerRequest = function () {

  /**
   * Creates an instance of ServerRequest.
   *
   * @param {*} payload
   *
   * @memberOf ServerRequest
   */
  function ServerRequest(payload) {
    _classCallCheck(this, ServerRequest);

    this._request = {};
    this.payload = payload;
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ServerRequest
   */


  _createClass(ServerRequest, [{
    key: "payload",
    get: function get() {
      return this._request.value;
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf ServerRequest
     */
    ,


    /**
     *
     *
     *
     * @memberOf ServerRequest
     */
    set: function set(value) {
      this._request.value = value;
    }

    /**
     *
     *
     *
     * @memberOf ServerRequest
     */

  }, {
    key: "error",
    get: function get() {
      return this._request.error;
    },
    set: function set(error) {
      this._request.error = error;
    }
  }]);

  return ServerRequest;
}();

exports.default = ServerRequest;
//# sourceMappingURL=serverRequest.js.map