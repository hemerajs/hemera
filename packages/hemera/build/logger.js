'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

var _hoek = require('hoek');

var _hoek2 = _interopRequireDefault(_hoek);

var _pino = require('pino');

var _pino2 = _interopRequireDefault(_pino);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Pretty = _pino2.default.pretty();

//Config
var defaultConfig = {
  level: 'silent',
  levels: ['info', 'warn', 'debug', 'trace', 'error', 'fatal']
};

/**
 * @class Logger
 */

var Logger = function () {
  /**
   * Creates an instance of Logger.
   *
   * @param {any} params
   *
   * @memberOf Logger
   */
  function Logger(params) {
    var _this = this;

    _classCallCheck(this, Logger);

    var self = this;

    self._config = _hoek2.default.applyToDefaults(defaultConfig, params || {});

    //Leads to too much listeners in tests
    if (this._config.level !== 'silent') {
      Pretty.pipe(process.stdout);
    }

    this._logger = (0, _pino2.default)({
      name: 'app',
      safe: true,
      level: this._config.level
    }, Pretty);

    //Set levels, create new prototype methods
    self._config.levels.forEach(function (level) {

      var that = _this;

      that[level] = function () {

        var args = [level].concat(Array.prototype.slice.call(arguments));
        self.log.apply(self, args);
      };
    });
  }

  /**
   * @memberOf Logger
   */


  _createClass(Logger, [{
    key: 'log',
    value: function log() {

      this._logger[arguments[0]].apply(this._logger, Array.prototype.slice.call(arguments).slice(1));
    }
  }]);

  return Logger;
}();

module.exports = Logger;
//# sourceMappingURL=logger.js.map