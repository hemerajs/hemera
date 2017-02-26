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

var ID_LENGTH = 16;
var ID_DIGITS = '0123456789abcdef';

/**
 * @class Util
 */

var Util = function () {
  function Util() {
    _classCallCheck(this, Util);
  }

  _createClass(Util, null, [{
    key: 'randomId',

    /**
     * @returns
     *
     * @memberOf Util
     */
    value: function randomId() {
      var n = '';
      for (var i = 0; i < ID_LENGTH; i++) {
        var rand = Math.floor(Math.random() * ID_DIGITS.length);

        // avoid leading zeroes
        if (rand !== 0 || n.length > 0) {
          n += ID_DIGITS[rand];
        }
      }
      return n;
    }

    /**
     *
     *
     * @static
     * @param {any} array
     * @param {any} method
     * @param {any} callback
     *
     * @memberOf Util
     */

  }, {
    key: 'serial',
    value: function serial(array, method, callback) {
      if (!array.length) {
        callback();
      } else {
        var i = 0;
        var iterate = function iterate() {
          var done = function done(err) {
            if (err) {
              callback(err);
            } else {
              i = i + 1;
              if (i < array.length) {
                iterate();
              } else {
                callback();
              }
            }
          };

          method(array[i], done, i);
        };

        iterate();
      }
    }
    /**
     * Get high resolution time in nanoseconds
     *
     * @static
     * @returns
     *
     * @memberOf Util
     */

  }, {
    key: 'nowHrTime',
    value: function nowHrTime() {
      var hrtime = process.hrtime();
      return Math.floor(hrtime[0] * 1000000 + hrtime[1] / 1000);
    }
    /**
     *
     *
     * @static
     * @param {any} obj
     * @returns
     *
     * @memberOf Util
     */

  }, {
    key: 'extractSchema',
    value: function extractSchema(obj) {
      if (obj === null) return obj;

      return _lodash2.default.pickBy(obj, function (val, prop) {
        return _lodash2.default.isObject(val);
      });
    }
    /**
     * @static
     * @param {any} obj
     * @returns
     *
     * @memberOf Util
     */

  }, {
    key: 'cleanPattern',
    value: function cleanPattern(obj) {
      if (obj === null) return obj;

      return _lodash2.default.pickBy(obj, function (val, prop) {
        return !_lodash2.default.includes(prop, '$') && !_lodash2.default.isObject(val);
      });
    }

    /**
     * @param {any} args
     * @returns
     *
     * @memberOf Util
     */

  }, {
    key: 'pattern',
    value: function pattern(args) {
      if (_lodash2.default.isString(args)) {
        return args;
      }

      args = args || {};
      var sb = [];
      _lodash2.default.each(args, function (v, k) {
        if (!~k.indexOf('$') && !_lodash2.default.isFunction(v)) {
          sb.push(k + ':' + v);
        }
      });

      sb.sort();

      return sb.join(',');
    }
  }]);

  return Util;
}();

exports.default = Util;
//# sourceMappingURL=util.js.map