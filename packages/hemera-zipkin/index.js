'use strict'

const Zipkin = require('./lib/index')
const Hoek = require('hoek')

//Config
let defaultConfig = {
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans'
}

exports.plugin = function hemeraZipkin(options) {

  var hemera = this

  const config = Hoek.applyToDefaults(defaultConfig, options || {})

  const Tracer = new Zipkin(config)

  hemera.on('onServerPreRequest', function (ctx) {

    //Zipkin tracing
    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: 1
    }

    ctx._zkTrace = Tracer.send_server_recv(traceData, {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    })
  })

  hemera.on('onServerPreResponse', function (ctx) {

    //Zipkin tracing
    Tracer.send_server_send(ctx._zkTrace, {
      service: ctx.trace$.service,
      name: ctx.trace$.method,
      serverName: config.serverName
    })

  })

  hemera.on('onClientPreRequest', function (ctx) {

    //Zipkin tracing
    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: 1
    }

    ctx._zkTrace = Tracer.send_client_send(traceData, {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    })

  })

  hemera.on('onClientPostRequest', function (ctx) {

    //Zipkin tracing
    Tracer.send_client_recv(ctx._zkTrace, {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    })

  })

}

exports.options = {}

exports.attributes = {
  name: 'hemera-zipkin'
}
