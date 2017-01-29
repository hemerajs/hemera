"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ClientRequest
 */
var ClientRequest = function () {

  /**
   * Creates an instance of ClientRequest.
   *
   * @param {Hemera} ctx
   *
   * @memberOf ClientRequest
   */
  function ClientRequest(ctx) {
    _classCallCheck(this, ClientRequest);

    this._ctx = ctx;
    this._request = {};
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientRequest
   */


  _createClass(ClientRequest, [{
    key: "payload",
    get: function get() {

      return this._request.value;
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf ClientRequest
     */
    ,


    /**
     *
     *
     *
     * @memberOf ClientRequest
     */
    set: function set(value) {

      this._request.value = value;
    }

    /**
     *
     *
     *
     * @memberOf ClientRequest
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

  return ClientRequest;
}();

module.exports = ClientRequest;
//# sourceMappingURL=clientRequest.js.map