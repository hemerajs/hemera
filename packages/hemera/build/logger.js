'use strict';

var _hoek = require('hoek');

var _hoek2 = _interopRequireDefault(_hoek);

var _pino = require('pino');

var _pino2 = _interopRequireDefault(_pino);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

var Pretty = _pino2.default.pretty();

//Config
var defaultConfig = {
  level: 'silent',
  levels: ['info', 'warn', 'debug', 'trace', 'error', 'fatal']
};

/**
 * @class Logger
 */

var Logger =
/**
 * Creates an instance of Logger.
 *
 * @param {any} params
 *
 * @memberOf Logger
 */
function Logger(params) {
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

  this.__proto__ = this._logger;
};

module.exports = Logger;
//# sourceMappingURL=logger.js.map