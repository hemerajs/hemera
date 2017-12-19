'use strict'

const HemeraJwt = require('../../packages/hemera-jwt-auth')
HemeraJwt[Symbol.for('options')].jwt.secret = 'test'

process.setMaxListeners(0)

describe('Hemera-jwt-auth', function() {
  const PORT = 6244
  var authUrl = 'nats://localhost:' + PORT
  var server

  const tokenDecoded = {
    scope: ['math', 'a']
  }
  const jwtToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJtYXRoIiwiYSJdfQ.2xnjYtIXDx_8wLL-taay_xjQX7G7NX1rTdwMAR59k74'

  // Start up our own nats-server
  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    server.kill()
  })

  it('Should be able to pass the metadata (token) to nested acts', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'sub',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          cb(null, req.a - req.b)
        }
      )
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          this.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: req.a + req.b,
              b: 100
            },
            function(err, res) {
              cb(err, res)
            }
          )
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(200)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to authorize with scope as array', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: ['math', 'a']
          }
        },
        function(req, cb) {
          cb(null, true)
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to authorize with scope as string', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          cb(null, true)
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should return an error when scope is invalid', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: 'math111'
          }
        },
        function(req, cb) {
          cb(null, true)
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('JwtError')
          expect(err.message).to.be.equals('Invalid scope')
          hemera.close(done)
        }
      )
    })
  })

  it('Should return an error when auth object is no object', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: 2232323
        },
        function(req, cb) {
          cb()
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('JwtError')
          expect(err.message).to.be.equals('Invalid auth$ options')
          hemera.close(done)
        }
      )
    })
  })

  it('Should return an error when token is invalid', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: 2232323
        },
        function(req, cb) {
          cb()
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken: 'foobar'
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('JsonWebTokenError')
          expect(err.message).to.be.equals('jwt malformed')
          hemera.close(done)
        }
      )
    })
  })

  it('Should return an error when token is empty', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: 2232323
        },
        function(req, cb) {
          cb()
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken: ''
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('JsonWebTokenError')
          expect(err.message).to.be.equals('jwt must be provided')
          hemera.close(done)
        }
      )
    })
  })

  it('Should ignore authentication when auth is disabled', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'sub',
          auth$: {
            enabled: false
          }
        },
        function(req, cb) {
          cb(null, req.a - req.b)
        }
      )
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          delete this.meta$['jwtToken']

          this.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: req.a + req.b,
              b: 100
            },
            function(err, res) {
              cb(err, res)
            }
          )
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(200)
          hemera.close(done)
        }
      )
    })
  })

  it('Should return an error because requestor has not full rights', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: ['math', 'a', 'b']
          }
        },
        function(req, cb) {
          cb(null, true)
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.exists()
          expect(err.name).to.be.equals('JwtError')
          expect(err.message).to.be.equals('Invalid scope')
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to access decoded token in server method', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          expect(this.auth$.scope).to.be.equals(tokenDecoded.scope)
          cb(null, req.a + req.b)
        }
      )

      hemera.act(
        {
          meta$: {
            jwtToken
          },
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(300)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not enfore authentication', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt, {
      enforceAuth: false
    })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(req, cb) {
          cb(null, req.a + req.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(300)
          hemera.close(done)
        }
      )
    })
  })

  it('Should not enfore authentication but allows to enable it selectively', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      crashOnFatal: false
    })

    hemera.use(HemeraJwt, {
      enforceAuth: false
    })

    hemera.ready(() => {
      // Disable it by option
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(req, cb) {
          cb(null, req.a + req.b)
        }
      )

      // Enable authentication
      hemera.add(
        {
          topic: 'math',
          cmd: 'sub',
          auth$: {
            scope: 'math'
          }
        },
        function(req, cb) {
          cb(null, req.a - req.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 100,
          b: 200
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(300)
          hemera.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: 500,
              b: 200
            },
            function(err, resp) {
              expect(err).to.be.exists()
              hemera.close(done)
            }
          )
        }
      )
    })
  })
})
