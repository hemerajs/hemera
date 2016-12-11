'use strict'

const Zipkin = require('./lib/index')
const Hoek = require('hoek')

//Config
let defaultConfig = {
  serverName: '',
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

    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: config.serverName
    })

    Tracer.add_binary(meta, ctx.delegate$)

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: 1
    }

    ctx._zkTrace = Tracer.send_server_recv(traceData, meta)

  })

  hemera.on('onServerPreResponse', function (ctx) {

    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: config.serverName
    })

    Tracer.add_binary(meta, ctx.delegate$)

    Tracer.send_server_send(ctx._zkTrace, meta)

  })

  hemera.on('onClientPreRequest', function (ctx) {

    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: config.serverName
    })

    Tracer.add_binary(meta, ctx.delegate$)

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: 1
    }

    ctx._zkTrace = Tracer.send_client_send(traceData, meta)

  })

  hemera.on('onClientPostRequest', function (ctx) {

    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: config.serverName
    })

    Tracer.add_binary(meta, ctx.delegate$)

    Tracer.send_client_recv(ctx._zkTrace, meta)

  })

}

exports.options = {}

exports.attributes = {
  name: 'hemera-zipkin'
}
