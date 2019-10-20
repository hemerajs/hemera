'use strict'

describe('Hemera default config', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should check default config', function(done) {
    const nats = require('nats').connect(authUrl)

    var defaultConfig = {
      timeout: 2000, // Max execution time of a request
      pluginTimeout: 10, // The number of millis to wait a plugin to load after which it will error
      tag: '',
      prettyLog: false,
      name: 'test', // node name
      logLevel: 'silent', // 'fatal', 'error', 'warn', 'info', 'debug', 'trace'; also 'silent'
      childLogger: false, // Create a child logger per section / plugin. Only possible with default logger Pino.
      maxRecursion: 0, // Max recursive method calls
      errio: {
        recursive: true, // Recursively serialize and deserialize nested errors
        inherited: true, // Include inherited properties
        stack: true, // Include stack property
        private: false, // Include properties with leading or trailing underscores
        exclude: [], // Property names to exclude (low priority)
        include: [] // Property names to include (high priority)
      },
      traceLog: false,
      bloomrun: {
        indexing: 'insertion', // Pattern indexing method "insertion" or "depth"
        lookupBeforeAdd: false // Checks if the pattern is no duplicate based on to the indexing strategy
      },
      load: {
        checkPolicy: true, // Check on every request (server) if the load policy was observed,
        policy: {
          sampleInterval: 0, // Frequency of load sampling in milliseconds (zero is no sampling)
          maxHeapUsedBytes: 0, // Reject requests when V8 heap is over size in bytes (zero is no max)
          maxRssBytes: 0, // Reject requests when process RSS is over size in bytes (zero is no max)
          maxEventLoopDelay: 0 // Milliseconds of delay after which requests are rejected (zero is no max)
        }
      }
    }

    const hemera = new Hemera(nats, {
      name: 'test'
    })

    expect(hemera.config).to.be.equals(defaultConfig)

    hemera.close(done)
  })

  it('Should throw error because invalid config values', function(done) {
    const nats = require('nats').connect(authUrl)

    try {
      // eslint-disable-next-line no-new
      new Hemera(nats, {
        logLevel: 'foo'
      })
    } catch (err) {
      expect(err.name).to.be.equals('ValidationError')
      nats.close()
      done()
    }
  })
})
