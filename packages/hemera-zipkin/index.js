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
  sampling: 0.1
}

function hemeraZipkin(hemera, opts, done) {
  const config = Hoek.applyToDefaults(defaultConfig, opts || {})
  const Tracer = new Zipkin(config)

  /**
   * Server send
   */
  hemera.on('serverPreResponse', function(ctx) {
    let meta = {
      service: ctx._topic,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)
    Tracer.addBinary(meta, {
      'server.topic': ctx._topic,
      'server.maxMessages': ctx.matchedAction
        ? ctx.matchedAction.pattern.maxMessages$ || 0
        : 0,
      'server.pubsub': ctx.matchedAction
        ? ctx.matchedAction.pattern.pubsub$ || false
        : false
    })

    hemera.log.debug(
      {
        traceData: ctx._zkTrace,
        meta: meta
      },
      'sendServerSend'
    )

    Tracer.sendServerSend(ctx._zkTrace, meta)
  })

  /**
   * Server received
   */
  hemera.on('serverPreRequest', function(ctx) {
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    Tracer.addBinary(meta, {
      'server.topic': ctx._topic,
      'server.maxMessages': ctx.matchedAction
        ? ctx.matchedAction.pattern.maxMessages$ || 0
        : 0,
      'server.pubsub': ctx.matchedAction
        ? ctx.matchedAction.pattern.pubsub$ || false
        : false
    })

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      timestamp: ctx.trace$.timestamp,
      sampled: ctx.trace$.sampled
    }

    hemera.log.debug(
      {
        traceData: traceData,
        meta: meta
      },
      'sendServerRecv'
    )

    ctx._zkTrace = Tracer.sendServerRecv(traceData, meta)
  })

  /**
   * Client send
   */
  hemera.on('clientPreRequest', function(ctx) {
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)
    Tracer.addBinary(meta, {
      'rpc.topic': ctx.trace$.service,
      'rpc.method': ctx.trace$.method,
      'rpc.timeout': ctx._pattern.timeout$ || ctx.config.timeout,
      'rpc.maxMessages': ctx._pattern.maxMessages$ || 0,
      'rpc.pubsub': ctx._pattern.pubsub$ || false
    })

    ctx.trace$.sampled = Tracer.shouldSample()

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: ctx.trace$.sampled
    }

    hemera.log.debug(
      {
        traceData: traceData,
        meta: meta
      },
      'sendClientSend'
    )

    ctx._zkTrace = Tracer.sendClientSend(traceData, meta)
  })

  /**
   * Client received
   */
  hemera.on('clientPostRequest', function(ctx) {
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    hemera.log.debug(
      {
        traceData: ctx._zkTrace,
        meta: meta
      },
      'sendClientRecv'
    )

    Tracer.sendClientRecv(ctx._zkTrace, meta)
  })

  done()
}

const plugin = Hp(hemeraZipkin, {
  hemera: '^3.0.0',
  name: require('./package.json').name
})

module.exports = plugin
