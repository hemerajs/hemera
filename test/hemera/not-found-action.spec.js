'use strict'

describe('Not found action', function() {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    server.kill()
  })

  it('Should be able to define a notFound action', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.setNotFoundPattern({
        topic: 'math',
        cmd: 'notFound'
      })

      hemera.add(
        {
          topic: 'math',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, true)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('setNotFoundPattern should accept a pattern as string', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.setNotFoundPattern('topic:math,cmd:notFound')

      hemera.add(
        {
          topic: 'math',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, true)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be encapsulated in plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'math',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'math',
        cmd: 'notFound'
      })
      done()
    })

    hemera.ready(() => {
      expect(hemera.notFoundPattern).to.be.equals(null)
      hemera.close(done)
    })
  })

  it('Should be encapsulated in plugin from root / 2', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'A',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'A',
        cmd: 'notFound'
      })
      hemera.add(
        {
          topic: 'A',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, true)
        }
      )
      hemera.act(
        {
          topic: 'A',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
      done()
    })

    hemera.ready(() => {
      expect(hemera.notFoundPattern).to.be.equals(null)

      hemera.act(
        {
          topic: 'B',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('TimeoutError')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be encapsulated in plugin from root / 3', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'A',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'A',
        cmd: 'notFound'
      })
      hemera.add(
        {
          topic: 'A',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, 'A')
        }
      )
      done()
    })

    hemera.ready(() => {
      hemera.setNotFoundPattern({
        topic: 'B',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'B',
        cmd: 'notFound'
      })
      hemera.add(
        {
          topic: 'B',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, 'B')
        }
      )

      hemera.act(
        {
          topic: 'A',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals('A')
          hemera.act(
            {
              topic: 'B',
              cmd: 'dedede',
              timeout$: 200
            },
            function(err, resp) {
              expect(err).to.be.not.exists()
              expect(resp).to.be.equals('B')
              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should be encapsulated in ensted plugin from root / 4', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'A',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'A',
        cmd: 'notFound'
      })
      hemera.add(
        {
          topic: 'A',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, 'A')
        }
      )
      hemera.use((hemera, opts, done) => {
        hemera.setNotFoundPattern({
          topic: 'B',
          cmd: 'notFound'
        })
        expect(hemera.notFoundPattern).to.be.equals({
          topic: 'B',
          cmd: 'notFound'
        })
        hemera.add(
          {
            topic: 'B',
            cmd: 'notFound'
          },
          (req, cb) => {
            cb(null, 'B')
          }
        )
        done()
      })
      done()
    })

    hemera.ready(() => {
      hemera.setNotFoundPattern({
        topic: 'C',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'C',
        cmd: 'notFound'
      })
      hemera.add(
        {
          topic: 'C',
          cmd: 'notFound'
        },
        (req, cb) => {
          cb(null, 'C')
        }
      )

      hemera.act(
        {
          topic: 'A',
          cmd: 'dedede',
          timeout$: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals('A')
          hemera.act(
            {
              topic: 'B',
              cmd: 'dedede',
              timeout$: 200
            },
            function(err, resp) {
              expect(err).to.be.not.exists()
              expect(resp).to.be.equals('B')
              hemera.act(
                {
                  topic: 'C',
                  cmd: 'dedede',
                  timeout$: 200
                },
                function(err, resp) {
                  expect(err).to.be.not.exists()
                  expect(resp).to.be.equals('C')
                  hemera.close(done)
                }
              )
            }
          )
        }
      )
    })
  })

  it('Nested plugin should inherit notfound Pattern', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'A',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'A',
        cmd: 'notFound'
      })
      hemera.use((hemera, opts, done) => {
        expect(hemera.notFoundPattern).to.be.equals({
          topic: 'A',
          cmd: 'notFound'
        })
        done()
      })
      done()
    })

    hemera.ready(() => {
      hemera.close(done)
    })
  })

  it('Should be able to reset notfound Pattern inside nested plugin', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.use((hemera, opts, done) => {
      hemera.setNotFoundPattern({
        topic: 'A',
        cmd: 'notFound'
      })
      expect(hemera.notFoundPattern).to.be.equals({
        topic: 'A',
        cmd: 'notFound'
      })
      hemera.use((hemera, opts, done) => {
        hemera.setNotFoundPattern(null)
        expect(hemera.notFoundPattern).to.be.equals(null)
        done()
      })
      done()
    })

    hemera.ready(() => {
      hemera.close(done)
    })
  })
})
