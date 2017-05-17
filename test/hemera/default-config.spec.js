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
      timeout: 2000, // max execution time of a request
      generators: false, // promise and generators support
      name: 'hemera-' + Os.hostname(), // node name
      crashOnFatal: true, // Should gracefully exit the process at unhandled exceptions
      logLevel: 'silent',
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
        lookupBeforeAdd: true // Should throw an error when pattern matched with existign set
      },
      load: {
        checkPolicy: true,
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
        minSuccesses: 1,
        halfOpenTime: 5 * 1000,
        resetIntervalTime: 15 * 1000,
        maxFailures: 3
      }
    }

    const hemera = new Hemera(nats)

    expect(hemera.config).to.be.equals(defaultConfig)

    hemera.close()
    done()
  })
})
