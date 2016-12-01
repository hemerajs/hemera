/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

const SuperError = require('super-error')

const
  HemeraError = SuperError.subclass('HemeraError'),
  ParseError = HemeraError.subclass('HemeraParseError'),
  TimeoutError = HemeraError.subclass('TimeoutError'),
  ImplementationError = HemeraError.subclass('ImplementationError'),
  BusinessError = HemeraError.subclass('BusinessError'),
  FatalError = HemeraError.subclass('FatalError'),
  PatternNotFound = HemeraError.subclass('PatternNotFound'),
  PayloadValidationError = SuperError.subclass('PayloadValidationError')

module.exports = {
  HemeraError,
  ParseError,
  TimeoutError,
  ImplementationError,
  BusinessError,
  FatalError,
  PatternNotFound,
  PayloadValidationError
}