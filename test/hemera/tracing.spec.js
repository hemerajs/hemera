'use strict'

describe('Tracing', function() {
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

  it('Should set correct request parentId$, span and request$ context', function(done) {
    /**
     * math:add-->math:sub
     *            math:add
     *            math:add-->
     *
     */

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      expect(this.parentId$).to.be.not.exists()

      let traceId = '' // Is unique in a request

      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        function(resp, cb) {
          expect(this.trace$.traceId).to.be.string()
          expect(this.trace$.spanId).to.be.string()

          cb(null, resp.a + resp.b)
        }
      )

      hemera.add(
        {
          topic: 'math',
          cmd: 'sub'
        },
        function(resp, cb) {
          let r1 = this.request$.id

          expect(this.trace$.traceId).to.be.string()
          expect(this.trace$.spanId).to.be.string()
          expect(this.request$.parentId).to.be.exists()
          expect(this.trace$.parentSpanId).to.be.string()

          this.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          })

          setTimeout(() => {
            this.act(
              {
                topic: 'math',
                cmd: 'add',
                a: 1,
                b: 2
              },
              function(err, resp2) {
                let r2 = this.request$.id

                expect(err).to.be.not.exists()
                expect(this.request$.parentId).to.be.equals(r1)

                expect(this.trace$.traceId).to.be.equals(traceId)
                expect(this.trace$.spanId).to.be.string()
                expect(this.trace$.timestamp).to.be.number()

                this.act(
                  {
                    topic: 'math',
                    cmd: 'add',
                    a: 10,
                    b: 2
                  },
                  function(err, resp2) {
                    expect(err).to.be.not.exists()
                    expect(this.request$.parentId).to.be.equals(r2)
                    expect(this.trace$.parentSpanId).to.be.string()
                    expect(this.trace$.traceId).to.be.equals(traceId)
                    expect(this.trace$.spanId).to.be.string()
                    expect(this.trace$.timestamp).to.be.number()

                    cb(null, resp.a - resp.b)
                  }
                )
              }
            )
          }, 200)
        }
      )

      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        function(err, resp) {
          let r1 = this.request$.id
          expect(err).to.be.not.exists()
          expect(this.trace$.traceId).to.be.exists()
          expect(this.trace$.spanId).to.be.string()
          expect(this.trace$.timestamp).to.be.number()
          expect(this.request$.id).to.be.string()

          traceId = this.trace$.traceId

          this.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: 1,
              b: resp
            },
            function(err, resp) {
              expect(err).to.be.not.exists()
              expect(this.request$.parentId).to.be.equals(r1)

              expect(this.trace$.traceId).to.be.equals(traceId)
              expect(this.trace$.spanId).to.be.string()
              expect(this.trace$.parentSpanId).to.be.string()
              expect(this.trace$.timestamp).to.be.number()
              expect(this.request$.id).to.be.string()
              expect(this.request$.parentId).to.be.a.string()

              hemera.close(done)
            }
          )
        }
      )
    })
  })

  it('Should get correct tracing informations', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.on('serverPreRequest', function(ctx) {
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        let traceData = {
          traceId: ctx.trace$.traceId,
          parentSpanId: ctx.trace$.parentSpanId,
          spanId: ctx.trace$.spanId,
          sampled: 1
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')

        expect(traceData.traceId).to.be.exist()
        expect(traceData.parentSpanId).to.be.not.exist()
        expect(traceData.spanId).to.be.exist()
        expect(traceData.sampled).to.be.exist()
      })

      hemera.on('serverPreResponse', function(ctx) {
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')
      })

      hemera.on('clientPreRequest', function(ctx) {
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        let traceData = {
          traceId: ctx.trace$.traceId,
          parentSpanId: ctx.trace$.parentSpanId,
          spanId: ctx.trace$.spanId,
          sampled: 1
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')

        expect(traceData.traceId).to.be.exist()
        expect(traceData.parentSpanId).to.be.not.exist()
        expect(traceData.spanId).to.be.exist()
        expect(traceData.sampled).to.be.exist()
      })

      hemera.on('clientPostRequest', function(ctx) {
        let meta = {
          service: ctx.trace$.service,
          name: ctx.trace$.method
        }

        expect(meta.service).to.be.equals('math')
        expect(meta.name).to.be.equals('a:1,b:2,cmd:add,topic:math')
      })

      hemera.add(
        {
          cmd: 'add',
          topic: 'math'
        },
        (resp, cb) => {
          cb(null, resp.a + resp.b)
        }
      )

      hemera.act(
        {
          cmd: 'add',
          topic: 'math',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })

  it('Should extract trace method from pattern', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'TOPIC',
          cmd: 'CMD'
        },
        function(req, next) {
          next()
        }
      )
      hemera.act(
        {
          topic: 'TOPIC',
          cmd: 'CMD',
          a: {
            b: 1
          }
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(this.trace$.method).to.be.equals('cmd:CMD,topic:TOPIC')
          hemera.close(done)
        }
      )
    })
  })

  it('Should overwrite trace$ informations with pattern', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.ext('onClientPreRequest', (hemera, next) => {
        expect(hemera.trace$.spanId).to.be.equals(1)
        expect(hemera.trace$.traceId).to.be.equals(2)
        expect(hemera.trace$.parentSpanId).to.be.not.exists()
        next()
      })
      hemera.add(
        {
          topic: 'TOPIC',
          cmd: 'CMD'
        },
        function(req, next) {
          next()
        }
      )
      hemera.act(
        {
          topic: 'TOPIC',
          cmd: 'CMD',
          trace$: {
            spanId: 1,
            traceId: 2
          }
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(this.trace$.parentSpanId).to.be.not.exists()
          expect(this.trace$.method).to.be.equals('cmd:CMD,topic:TOPIC')
          hemera.close(done)
        }
      )
    })
  })

  it('Should overwrite parentSpanId with pattern', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'TOPIC',
          cmd: 'CMD'
        },
        function(req, next) {
          next()
        }
      )
      hemera.act(
        {
          topic: 'TOPIC',
          cmd: 'CMD',
          trace$: {
            spanId: 1,
            traceId: 2,
            parentSpanId: 3
          }
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(this.trace$.parentSpanId).to.be.equals(3)
          expect(this.trace$.method).to.be.equals('cmd:CMD,topic:TOPIC')
          hemera.close(done)
        }
      )
    })
  })

  it('Should get correct parentSpanId information', function(done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add(
        {
          topic: 'TOPIC',
          cmd: 'CMD'
        },
        function(req, next) {
          next()
        }
      )
      hemera.act(
        {
          topic: 'TOPIC',
          cmd: 'CMD'
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          const parent = this.trace$
          this.act(
            {
              topic: 'TOPIC',
              cmd: 'CMD'
            },
            function(err, resp) {
              expect(err).to.be.not.exists()
              expect(this.trace$.parentSpanId).to.be.equals(parent.spanId)
              hemera.close(done)
            }
          )
        }
      )
    })
  })
})
