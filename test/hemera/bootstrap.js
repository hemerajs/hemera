'use strict'

global.Hemera = require('../../packages/hemera')
global.Code = require('code')
global.Sinon = require('sinon')
global.HemeraTestsuite = require('hemera-testsuite')

global.expect = Code.expect
global.UnauthorizedError = Hemera.createError('Unauthorized')

process.setMaxListeners(0)