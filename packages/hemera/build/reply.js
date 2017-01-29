"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * @class Reply
 */
var Reply = function () {

  /**
   * Creates an instance of Reply.
   *
   * @param {Hemera} ctx
   *
   * @memberOf Reply
   */
  function Reply(ctx) {
    _classCallCheck(this, Reply);

    this.ctx = ctx;
  }

  /**
   *
   *
   * @param {*} value
   *
   * @memberOf Reply
   */


  _createClass(Reply, [{
    key: "reply",
    value: function reply(value) {

      if (value instanceof Error) {

        this.next(value);
      } else {

        this.next(null, value);
      }
    }

    /**
     *
     *
     * @returns
     *
     * @memberOf Reply
     */

  }, {
    key: "continue",
    value: function _continue() {

      this.next();

      return this;
    }
  }]);

  return Reply;
}();

module.exports = Reply;
//# sourceMappingURL=reply.js.map