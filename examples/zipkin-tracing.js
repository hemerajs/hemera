'use strict'

const Hemera = require('./../')
const nats = require('nats').connect()
const ZipkinTracer = require('./../lib/zipkin-tracer')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

let zipkinTracer = new ZipkinTracer({
  httpLogger: {
    endpoint: 'http://192.168.99.100:9411/api/v1/spans'
  }
});

hemera.ready(() => {

  hemera.on('onPreProcessing', function (ctx) {

    //Zipkin tracing
    let id = zipkinTracer.serverRecv({
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      service: ctx.trace$.service,
      method: ctx.trace$.method
    })

    //Store id in context
    ctx.zkTraceId = id
  })

  hemera.on('onPreResponse', function (ctx) {

    //Zipkin tracing
    zipkinTracer.serverSend(ctx.zkTraceId)

  })

  hemera.on('onPreRequest', function (ctx) {

    //Zipkin tracing    
    let id = zipkinTracer.clientSend({
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      service: ctx.trace$.service,
      method: ctx.trace$.method
    })

    //Store id in context
    ctx.zkTraceId = id

  })

  hemera.on('onPostRequest', function (ctx) {

    //Zipkin tracing
    zipkinTracer.clientRecv(ctx.zkTraceId)

  })

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (resp, cb) {

    this.act({
      topic: 'math',
      cmd: 'sub',
      a: 100,
      b: 20
    }, function (err, resp) {

      this.act({
        topic: 'math',
        cmd: 'sub',
        a: 100,
        b: 50
      }, function (err, resp) {

        cb(null, resp)
      })
    })

  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, function (resp, cb) {

    cb(null, resp.a - resp.b)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 20
  }, function (err, resp) {

    this.log.info('Finished', resp)
  })

})