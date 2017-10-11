describe('Promise', function() {
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

  it('Should be able to return a promise in add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          return Promise.resolve(resp.a + resp.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should call add handler only once', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          spy()
          return Promise.resolve(resp.a + resp.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(resp).to.be.equals(3)
          expect(spy.calledOnce).to.be.equals(true)
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to reject a promise in add', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          return Promise.reject(new Error('test'))
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.exists()
          hemera.close(done)
        }
      )
    })
  })

  it('Should be able to return a promise in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera
        .act(
          {
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          },
          (err, resp) => {
            expect(err).not.to.be.exists()
            return Promise.resolve(resp.result)
          }
        )
        .then(result => {
          expect(result).to.be.equals(3)
          hemera.close(done)
        })
    })
  })

  it('Should call act handler only once', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)
    const spy = Sinon.spy()

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          return Promise.resolve(resp.a + resp.b)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          spy()
          expect(resp).to.be.equals(3)
          setTimeout(() => {
            expect(spy.calledOnce).to.be.equals(true)
            hemera.close(done)
          }, 20)
        }
      )
    })
  })

  it('Should be able to return a rejected promise in act', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(new Error('test'))
        }
      )

      hemera
        .act(
          {
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          },
          (err, resp) => {
            return Promise.reject(err)
          }
        )
        .catch(err => {
          expect(err).to.be.exists()
          hemera.close(done)
        })
    })
  })
})
