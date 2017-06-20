'use strict'

const Hp = require('hemera-plugin')
const Zipkin = require('./lib/index')
const Hoek = require('hoek')

// Config
let defaultConfig = {
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans',
  subscriptionBased: true, // when false the hemera tag represents the service otherwise the NATS topic name
  sampling: 1
}

exports.plugin = Hp(function hemeraZipkin (options) {
  var hemera = this

  const config = Hoek.applyToDefaults(defaultConfig, options || {})
  const Tracer = new Zipkin(config)

  /**
   * Server send
   */
  hemera.on('serverPreResponse', function () {
    const ctx = this
    let meta = {
      service: ctx._topic,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    hemera.log.debug({
      traceData: ctx._zkTrace,
      meta: meta
    }, 'sendServerSend')

    Tracer.sendServerSend(ctx._zkTrace, meta)
  })

  /**
   * Server received
   */
  hemera.on('serverPreRequest', function () {
    const ctx = this
    let meta = {
      service: ctx._topic,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      timestamp: ctx.trace$.timestamp,
      sampled: config.sampling
    }

    hemera.log.debug({
      traceData: traceData,
      meta: meta
    }, 'sendServerRecv')

    ctx._zkTrace = Tracer.sendServerRecv(traceData, meta)
  })

  /**
   * Client send
   */
  hemera.on('clientPreRequest', function () {
    const ctx = this
    let meta = {
      service: ctx._prevContext._topic || ctx.config.tag, // when act is on root level
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: config.sampling
    }

    hemera.log.debug({
      traceData: traceData,
      meta: meta
    }, 'sendClientSend')

    ctx._zkTrace = Tracer.sendClientSend(traceData, meta)
  })

  /**
   * Client received
   */
  hemera.on('clientPostRequest', function () {
    const ctx = this
    let meta = {
      service: ctx._prevContext._topic || ctx.config.tag, // when act is on root level
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    hemera.log.debug({
      traceData: ctx._zkTrace,
      meta: meta
    }, 'sendClientRecv')

    Tracer.sendClientRecv(ctx._zkTrace, meta)
  })
})

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
