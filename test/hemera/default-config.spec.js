'use strict'

const Os = require('os')

describe('Hemera default config', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

      // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

      // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should check default config', function (done) {
    const nats = require('nats').connect(authUrl)

    var defaultConfig = {
      timeout: 2000, // Max execution time of a request
      generators: false, // Promise and generators support
      name: 'hemera-' + Os.hostname(), // node name
      crashOnFatal: true, // Should gracefully exit the process at unhandled exceptions
      logLevel: 'silent', // 'fatal', 'error', 'warn', 'info', 'debug', 'trace'; also 'silent'
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
        indexing: 'inserting', // Pattern indexing method "inserting" or "depth"
        lookupBeforeAdd: true // Checks if the pattern is no duplicate based on to the indexing strategy
      },
      load: {
        checkPolicy: true, // Check on every request (server) if the load policy was observed,
        shouldCrash: true, // Should gracefully exit the process to recover from memory leaks or load
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

    const hemera = new Hemera(nats)

    expect(hemera.config).to.be.equals(defaultConfig)

    hemera.close()
    done()
  })
})
