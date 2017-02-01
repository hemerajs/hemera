"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class ClientResponse
 */
var ClientResponse = function () {

  /**
   * Creates an instance of ClientResponse.
   *
   *
   * @memberOf ClientResponse
   */
  function ClientResponse() {
    _classCallCheck(this, ClientResponse);

    this._response = {};
  }

  /**
   *
   *
   * @readonly
   * @type {*}
   * @memberOf ClientResponse
   */


  _createClass(ClientResponse, [{
    key: "payload",
    get: function get() {

      return this._response.value;
    }

    /**
     *
     *
     *
     * @memberOf ClientResponse
     */
    ,
    set: function set(value) {

      this._response.value = value;
    }

    /**
     *
     *
     *
     * @memberOf ClientResponse
     */

  }, {
    key: "error",
    set: function set(error) {

      this._response.error = error;
    }

    /**
     *
     *
     * @readonly
     * @type {*}
     * @memberOf ClientResponse
     */
    ,
    get: function get() {

      return this._response.error;
    }
  }]);

  return ClientResponse;
}();

module.exports = ClientResponse;
//# sourceMappingURL=clientResponse.js.map