const Joi = require('joi')
const Os = require('os')
const Stream = require('stream').Stream
const Util = require('./util')

module.exports = Joi.object().keys({
  // Max execution time of a request
  timeout: Joi.number()
    .integer()
    .default(2000),
  tag: Joi.string().default(''),
  // Enables pretty log formatter in Pino default logger
  prettyLog: Joi.boolean().default(true),
  // The name of the instance
  name: Joi.string().default(`hemera-${Os.hostname()}-${Util.randomId()}`),
  logLevel: Joi.any()
    .valid(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('silent'),
  // Create a child logger per section / plugin. Only possible with default logger Pino.
  childLogger: Joi.boolean().default(false),
  // Max recursive method calls
  maxRecursion: Joi.number()
    .integer()
    .default(0),
  // Custom logger
  logger: Joi.alternatives().try(
    Joi.object()
      .keys({
        info: Joi.func(),
        error: Joi.func(),
        debug: Joi.func(),
        fatal: Joi.func(),
        warn: Joi.func(),
        trace: Joi.func(),
        child: Joi.func()
      })
      .requiredKeys('info', 'error', 'debug', 'fatal', 'warn', 'trace')
      .unknown(),
    Joi.object().type(Stream)
  ),
  // Attach trace and request informations to the logs. It costs ~10% perf
  logTraceDetails: Joi.boolean().default(false),
  // The error serialization options
  errio: Joi.object()
    .keys({
      // Recursively serialize and deserialize nested errors
      recursive: Joi.boolean().default(true),
      // Include inherited properties
      inherited: Joi.boolean().default(true),
      // Include stack property
      stack: Joi.boolean().default(true),
      // Include properties with leading or trailing underscores
      private: Joi.boolean().default(false),
      // Property names to exclude (low priority)
      exclude: Joi.array()
        .items(Joi.string())
        .default([]),
      // Property names to include (high priority)
      include: Joi.array()
        .items(Joi.string())
        .default([])
    })
    .default(),
  // Pattern matching options
  bloomrun: Joi.object()
    .keys({
      indexing: Joi.any()
        .valid(['insertion', 'depth'])
        .default('insertion'),
      // Checks if the pattern is no duplicate depends on the indexing strategy
      lookupBeforeAdd: Joi.boolean().default(false)
    })
    .default(),
  load: Joi.object()
    .keys({
      // Check on every request (server) if the load policy has changed
      checkPolicy: Joi.boolean().default(true),
      process: Joi.object()
        .keys({
          // Frequency of load sampling in milliseconds (zero is no sampling)
          sampleInterval: Joi.number()
            .integer()
            .default(0)
        })
        .default(),
      policy: Joi.object()
        .keys({
          // Reject requests when V8 heap is over size in bytes (zero is no max)
          maxHeapUsedBytes: Joi.number()
            .integer()
            .default(0),
          // Reject requests when process RSS is over size in bytes (zero is no max)
          maxRssBytes: Joi.number()
            .integer()
            .default(0),
          // Milliseconds of delay after which requests are rejected (zero is no max)
          maxEventLoopDelay: Joi.number()
            .integer()
            .default(0)
        })
        .default()
    })
    .default()
})
