'use strict'

describe('Unsubscribe NATS topic', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to unsubscribe a NATS topic', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const callback = Sinon.spy()

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

      nats.on('unsubscribe', (sid, subject) => {
        expect(subject).to.be.equals('math')
        callback()
      })

      const result = hemera.remove('math')

      expect(hemera.topics.get('math')).to.be.not.exists()
      expect(hemera.topics.size).to.be.equals(0)
      expect(hemera.list().length).to.be.equals(0)
      expect(result).to.be.equals(true)
      expect(callback.called).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should be able to unsubscribe multiple pattern with the same pattern', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      bloomrun: {
        lookupBeforeAdd: false // avoid throwing duplicate pattern error
      }
    })

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

      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: {
            b: 1
          }
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      const result = hemera.remove('math')

      expect(hemera.topics.get('math')).to.be.not.exists()
      expect(hemera.topics.size).to.be.equals(0)
      expect(hemera.list().length).to.be.equals(0)
      expect(result).to.be.equals(true)
      hemera.close(done)
    })
  })

  it('Should not be able to unsubscribe a NATS topic because topic is required', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      expect(() => hemera.remove('')).to.throw(Error, 'The sid or topic name is required')
      hemera.close(done)
    })
  })

  it('Should return false when topic was not found', function(done) {
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

      const result = hemera.remove('math1')
      expect(hemera.topics.get('math')).to.be.exists()
      expect(result).to.be.equals(false)
      expect(hemera.topics.size).to.be.equals(1)
      expect(hemera.list().length).to.be.equals(1)
      hemera.close(done)
    })
  })

  it('Should be able to unsubscribe by regex', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'systems-europe.a.*'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      expect(hemera.list().length).to.be.equals(1)

      hemera.act(
        {
          topic: 'systems-europe.a.test'
        },
        function(err) {
          expect(err).to.be.not.exists()

          const result = hemera.remove('systems-europe.a.*')
          expect(result).to.be.equals(true)
          expect(hemera.topics.size).to.be.equals(0)
          expect(hemera.list().length).to.be.equals(0)
          hemera.close(done)
        }
      )
    })
  })

  it('Should throw error when topic is no string or subscription id', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      expect(() => hemera.remove(/abc/)).to.throw(Error, "Topic must be from type string or number but got 'object'")

      hemera.close(done)
    })
  })

  it('Should be able to unsubscribe all at once', function(done) {
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

      hemera.add(
        {
          topic: 'foo.*',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.add(
        {
          topic: 'order',
          cmd: 'create'
        },
        (resp, cb) => {
          cb()
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()

          hemera.removeAll()
          expect(hemera.topics.size).to.be.equals(0)
          expect(hemera.list().length).to.be.equals(0)
          hemera.close(done)
        }
      )
    })
  })

  it('Should remove pattern and subscription after maxMessages', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'debug' })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 1
        },
        function(resp, cb) {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(hemera.topics.get('math')).to.be.not.exists()
          expect(hemera.list().length).to.be.equals(0)
          hemera.close(done)
        }
      )
    })
  })

  it('Should remove pattern and subscription after 2 maxMessages', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, { logLevel: 'debug' })

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          maxMessages$: 2
        },
        function(resp, cb) {
          cb(null, {
            result: resp.a + resp.b
          })
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(hemera.topics.get('math')).to.be.number()
          expect(hemera.list().length).to.be.equals(1)
          hemera.act(
            {
              topic: 'math',
              cmd: 'add'
            },
            function(err, resp) {
              expect(err).to.be.not.exists()
              expect(hemera.topics.get('math')).to.be.not.exists()
              expect(hemera.list().length).to.be.equals(0)
              hemera.close(done)
            }
          )
        }
      )
    })
  })
})
