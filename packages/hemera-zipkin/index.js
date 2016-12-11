'use strict'

const Tracer = require('./lib/tracer')

exports.plugin = function hemeraZipkin(options) {

  var hemera = this

  let zipkinTracer = new Tracer({
    httpLogger: {
      endpoint: options.url
    }
  })

  hemera.on('onServerPreRequest', function (ctx) {

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

  hemera.on('onServerPreResponse', function (ctx) {

    //Zipkin tracing
    zipkinTracer.serverSend(ctx.zkTraceId)

  })

  hemera.on('onClientPreRequest', function (ctx) {

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

  hemera.on('onClientPostRequest', function (ctx) {

    //Zipkin tracing
    zipkinTracer.clientRecv(ctx.zkTraceId)

  })

}

exports.options = {
}

exports.attributes = {
  name: 'hemera-zipkin'
}
