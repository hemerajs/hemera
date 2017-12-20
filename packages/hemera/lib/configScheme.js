const Joi = require('joi')
const Os = require('os')
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
  // Should gracefully exit the process at unhandled exceptions or fatal errors
  crashOnFatal: Joi.boolean().default(true),
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
  logger: Joi.object().optional(),
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
      // Checks if the pattern is no duplicate based on to the indexing strategy
      lookupBeforeAdd: Joi.boolean().default(false)
    })
    .default(),
  load: Joi.object()
    .keys({
      // Check on every request (server) if the load policy was observed,
      checkPolicy: Joi.boolean().default(true),
      // Should gracefully exit the process to recover from memory leaks or load, crashOnFatal must be enabled
      shouldCrash: Joi.boolean().default(true),
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
