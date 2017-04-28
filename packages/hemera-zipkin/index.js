'use strict'

const Zipkin = require('./lib/index')
const Hoek = require('hoek')

// Config
let defaultConfig = {
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans'
}

exports.plugin = function hemeraZipkin (options) {
  var hemera = this

  const config = Hoek.applyToDefaults(defaultConfig, options || {})

  const Tracer = new Zipkin(config)

  hemera.on('serverPreRequest', function () {
    const ctx = this
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: ctx.config.name
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

  hemera.on('serverPreResponse', function () {
    const ctx = this
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: ctx.config.name
    })

    Tracer.add_binary(meta, ctx.delegate$)

    Tracer.send_server_send(ctx._zkTrace, meta)
  })

  hemera.on('clientPreRequest', function () {
    const ctx = this
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: ctx.config.name
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

  hemera.on('clientPostRequest', function () {
    const ctx = this
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    Tracer.add_binary(meta, {
      serverName: ctx.config.name
    })

    Tracer.add_binary(meta, ctx.delegate$)

    Tracer.send_client_recv(ctx._zkTrace, meta)
  })
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
