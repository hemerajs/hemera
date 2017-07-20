const Joi = require('joi')
const Os = require('os')
const Util = require('./util')

module.exports = Joi.object().keys({
  timeout: Joi.number().integer().default(2000),
  pluginTimeout: Joi.number().integer().default(3000),
  tag: Joi.string().default(''),
  prettyLog: Joi.boolean().default(true),
  name: Joi.string().default(`hemera-${Os.hostname()}-${Util.randomId()}`),
  crashOnFatal: Joi.boolean().default(true),
  logLevel: Joi.any().valid(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('silent'),
  childLogger: Joi.boolean().default(false),
  maxRecursion: Joi.number().integer().default(0),
  logger: Joi.object().optional(),
  errio: Joi.object().keys({
    recursive: Joi.boolean().default(true),
    inherited: Joi.boolean().default(true),
    stack: Joi.boolean().default(true),
    private: Joi.boolean().default(false),
    exclude: Joi.array().items(Joi.string()).default([]),
    include: Joi.array().items(Joi.string()).default([])
  }).default(),
  bloomrun: Joi.object().keys({
    indexing: Joi.string().default('inserting'),
    lookupBeforeAdd: Joi.boolean().default(true)
  }).default(),
  load: Joi.object().keys({
    checkPolicy: Joi.boolean().default(true),
    shouldCrash: Joi.boolean().default(true),
    process: Joi.object().keys({
      sampleInterval: Joi.number().integer().default(0)
    }).default(),
    policy: Joi.object().keys({
      maxHeapUsedBytes: Joi.number().integer().default(0),
      maxRssBytes: Joi.number().integer().default(0),
      maxEventLoopDelay: Joi.number().integer().default(0)
    }).default()
  }).default(),
  circuitBreaker: Joi.object().keys({
    enabled: Joi.boolean().default(false),
    minSuccesses: Joi.number().integer().default(1),
    halfOpenTime: Joi.number().integer().default(5000),
    resetIntervalTime: Joi.number().integer().default(15000),
    maxFailures: Joi.number().integer().default(3)
  }).default()
})
