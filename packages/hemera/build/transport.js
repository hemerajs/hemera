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
 *
 *
 * @class Transport
 */
var NatsTransport = function () {

  /**
   * Creates an instance of NatsTransport.
   *
   * @param {any} params
   *
   * @memberOf NatsTransport
   */
  function NatsTransport(params) {
    _classCallCheck(this, NatsTransport);

    this.nc = params.transport;
  }

  /**
   *
   *
   * @readonly
   *
   * @memberOf NatsTransport
   */


  _createClass(NatsTransport, [{
    key: "timeout",


    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */
    value: function timeout() {
      return this.nc.timeout.apply(this.nc, arguments);
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */

  }, {
    key: "send",
    value: function send() {
      return this.nc.publish.apply(this.nc, arguments);
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */

  }, {
    key: "close",
    value: function close() {
      return this.nc.close.apply(this.nc, arguments);
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */

  }, {
    key: "subscribe",
    value: function subscribe() {
      return this.nc.subscribe.apply(this.nc, arguments);
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */

  }, {
    key: "unsubscribe",
    value: function unsubscribe() {
      return this.nc.unsubscribe.apply(this.nc, arguments);
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf NatsTransport
     */

  }, {
    key: "sendRequest",
    value: function sendRequest() {
      return this.nc.request.apply(this.nc, arguments);
    }
  }, {
    key: "driver",
    get: function get() {
      return this.nc;
    }
  }]);

  return NatsTransport;
}();

exports.default = NatsTransport;
//# sourceMappingURL=transport.js.map