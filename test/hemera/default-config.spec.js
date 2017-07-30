'use strict'

describe('Hemera default config', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

      // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

      // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should check default config', function (done) {
    const nats = require('nats').connect(authUrl)

    var defaultConfig = {
      timeout: 2000, // Max execution time of a request
      pluginTimeout: 3000,
      tag: '',
      prettyLog: true,
      name: 'test', // node name
      crashOnFatal: true, // Should gracefully exit the process at unhandled exceptions or fatal errors
      logLevel: 'silent', // 'fatal', 'error', 'warn', 'info', 'debug', 'trace'; also 'silent'
      childLogger: false, // Create a child logger per section / plugin. Only possible with default logger Pino.
      maxRecursion: 0, // Max recursive method calls
      errio: {
        recursive: true, // Recursively serialize and deserialize nested errors
        inherited: true, // Include inherited properties
        stack: true,    // Include stack property
        private: false,  // Include properties with leading or trailing underscores
        exclude: [],     // Property names to exclude (low priority)
        include: []      // Property names to include (high priority)
      },
      bloomrun: {
        indexing: 'insertion', // Pattern indexing method "insertion" or "depth"
        lookupBeforeAdd: true // Checks if the pattern is no duplicate based on to the indexing strategy
      },
      load: {
        checkPolicy: true, // Check on every request (server) if the load policy was observed,
        shouldCrash: true, // Should gracefully exit the process to recover from memory leaks or load, crashOnFatal must be enabled
        process: {
          sampleInterval: 0  // Frequency of load sampling in milliseconds (zero is no sampling)
        },
        policy: {
          maxHeapUsedBytes: 0,  // Reject requests when V8 heap is over size in bytes (zero is no max)
          maxRssBytes: 0,       // Reject requests when process RSS is over size in bytes (zero is no max)
          maxEventLoopDelay: 0  // Milliseconds of delay after which requests are rejected (zero is no max)
        }
      },
      circuitBreaker: {
        enabled: false,
        minSuccesses: 1, // Minimum successes in the half-open state to change to close state
        halfOpenTime: 5 * 1000, // The duration when the server is ready to accept further calls after changing to open state
        resetIntervalTime: 15 * 1000, // Frequency of reseting the circuit breaker to close state in milliseconds
        maxFailures: 3 // The threshold when the circuit breaker change to open state
      }
    }

    const hemera = new Hemera(nats, {
      name: 'test'
    })

    expect(hemera.config).to.be.equals(defaultConfig)

    hemera.close(done)
  })

  it('Should throw error because invalid config values', function (done) {
    const nats = require('nats').connect(authUrl)

    try {
      const hemera = new Hemera(nats, {
        logLevel: 'foo'
      })
    } catch (err) {
      expect(err.name).to.be.equals('ValidationError')
      nats.close()
      done()
    }
  })
})
