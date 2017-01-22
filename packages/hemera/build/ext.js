'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

var _items = require('items');

var _items2 = _interopRequireDefault(_items);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Ext
 */
var Ext = function () {
  function Ext(type) {
    _classCallCheck(this, Ext);

    this._handler = [];
    this._type = type;
  }
  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Ext
   */


  _createClass(Ext, [{
    key: 'add',
    value: function add(handler) {

      this._handler.push(handler);
    }

    /**
     *
     *
     * @param {Array<Function>} handlers
     *
     * @memberOf Ext
     */

  }, {
    key: 'addRange',
    value: function addRange(handlers) {

      this._handler = this._handler.concat(handlers);
    }
    /**
     *
     *
     * @param {any} cb
     *
     * @memberOf Ext
     */

  }, {
    key: 'invoke',
    value: function invoke(ctx, cb) {

      var each = function each(ext, next) {

        var bind = ctx;

        ext.call(bind, next);
      };

      _items2.default.serial(this._handler, each, cb.bind(ctx));
    }
  }]);

  return Ext;
}();

module.exports = Ext;
//# sourceMappingURL=ext.js.map