'use strict'

global.Hemera = require('../../packages/hemera')
global.HemeraUtil = require('../../packages/hemera/lib/util')
global.BeforeExit = require('../../packages/hemera/lib/beforeExit')
global.CodecPipeline = require('../../packages/hemera/lib/codecPipeline')
global.Code = require('code')
global.Sinon = require('sinon')
global.HemeraTestsuite = require('hemera-testsuite')
global.NodeVersion = require('node-version')
global.expect = global.Code.expect
global.UnauthorizedError = Hemera.createError('Unauthorized')

process.setMaxListeners(0)
