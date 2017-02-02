'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _superError = require('super-error');

var _superError2 = _interopRequireDefault(_superError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HemeraError = _superError2.default.subclass('HemeraError'),
    ParseError = HemeraError.subclass('HemeraParseError'),
    TimeoutError = HemeraError.subclass('TimeoutError'),
    ImplementationError = HemeraError.subclass('ImplementationError'),
    BusinessError = HemeraError.subclass('BusinessError'),
    FatalError = HemeraError.subclass('FatalError'),
    PatternNotFound = HemeraError.subclass('PatternNotFound'),
    PayloadValidationError = _superError2.default.subclass('PayloadValidationError'); /*!
                                                                                       * hemera
                                                                                       * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
                                                                                       * MIT Licensed
                                                                                       */

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