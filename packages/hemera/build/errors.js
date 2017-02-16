'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _superError = require('super-error');

var _superError2 = _interopRequireDefault(_superError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HemeraError = _superError2.default.subclass('HemeraError'); /*!
                                                                 * hemera
                                                                 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
                                                                 * MIT Licensed
                                                                 */

var ParseError = HemeraError.subclass('HemeraParseError');
var TimeoutError = HemeraError.subclass('TimeoutError');
var ImplementationError = HemeraError.subclass('ImplementationError');
var BusinessError = HemeraError.subclass('BusinessError');
var FatalError = HemeraError.subclass('FatalError');
var PatternNotFound = HemeraError.subclass('PatternNotFound');
var PayloadValidationError = _superError2.default.subclass('PayloadValidationError');

exports.default = {
  HemeraError,
  ParseError,
  TimeoutError,
  ImplementationError,
  BusinessError,
  FatalError,
  PatternNotFound,
  PayloadValidationError
};
//# sourceMappingURL=errors.js.map