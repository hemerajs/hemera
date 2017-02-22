'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*!
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * hemera
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MIT Licensed
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 *
 * @export
 * @class Add
 */
var Add = function () {

  /**
   * Creates an instance of Add.
   * @param {any} actMeta
   *
   * @memberOf Add
   */
  function Add(actMeta) {
    _classCallCheck(this, Add);

    this.actMeta = actMeta;
    this.actMeta.middleware = actMeta.middleware || [];
  }

  /**
   *
   *
   * @param {any} handler
   * @returns
   *
   * @memberOf Add
   */


  _createClass(Add, [{
    key: 'use',
    value: function use(handler) {
      if (_lodash2.default.isArray(handler)) {
        this.actMeta.middleware = this.actMeta.middleware.concat(handler);
      } else {
        this.actMeta.middleware.push(handler);
      }
      return this;
    }
    /**
     *
     *
     * @param {any} cb
     *
     * @memberOf Add
     */

  }, {
    key: 'end',
    value: function end(cb) {
      this.actMeta.action = cb;
    }
    /**
     *
     *
     * @readonly
     *
     * @memberOf Add
     */

  }, {
    key: 'middleware',
    get: function get() {
      return this.actMeta.middleware;
    }
    /**
     *
     *
     * @readonly
     *
     * @memberOf Add
     */

  }, {
    key: 'schema',
    get: function get() {
      return this.actMeta.schema;
    }
    /**
     *
     *
     * @readonly
     *
     * @memberOf Add
     */

  }, {
    key: 'pattern',
    get: function get() {
      return this.actMeta.pattern;
    }
    /**
     *
     *
     *
     * @memberOf Add
     */

  }, {
    key: 'action',
    set: function set(action) {
      this.actMeta.action = action;
    }
    /**
     *
     *
     * @readonly
     *
     * @memberOf Add
     */
    ,
    get: function get() {
      return this.actMeta.action;
    }
    /**
     *
     *
     * @readonly
     *
     * @memberOf Add
     */

  }, {
    key: 'plugin',
    get: function get() {
      return this.actMeta.plugin;
    }
  }]);

  return Add;
}();

exports.default = Add;
//# sourceMappingURL=add.js.map