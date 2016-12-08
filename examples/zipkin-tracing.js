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
    topic: 'auth',
    cmd: 'signup',
  }, function (resp, cb) {

    let userId = 1

    this.act({
      topic: 'email',
      cmd: 'send',
      email: resp.email,
      message: 'Welcome!'
    }, function (err, resp) {

      this.act({
        topic: 'payment',
        cmd: 'process',
        userId: userId
      }, function (err, resp) {

        cb(null, true)
      })
    })

  })

  hemera.add({
    topic: 'payment',
    cmd: 'process'
  }, function (resp, cb) {

    cb(null, true)
  })

  hemera.add({
    topic: 'email',
    cmd: 'send'
  }, function (resp, cb) {

    cb(null, true)
  })

  /**
   * Call them
   */
  hemera.act({
    topic: 'auth',
    cmd: 'signup',
    email: 'peter@gmail.com',
    password: '1234'
  }, function (err, resp) {

    this.log.info('Finished', resp)
  })
})