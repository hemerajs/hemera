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

  const zipkinContextKey = Symbol('zipkin.context')
  hemera.decorate(zipkinContextKey, null)

  /**
   * Server send
   */
  hemera.on('serverPreResponse', function(ctx) {
    let meta = {
      service: ctx.trace$.service,
      name: ctx.trace$.method
    }

    if (config.subscriptionBased === false) {
      meta.service = ctx.config.tag
    }

    Tracer.addBinary(meta, ctx.delegate$)

    const addBinaryData = {
      'server.topic': ctx.trace$.service
    }

    if (ctx.matchedAction) {
      if (ctx.matchedAction.pattern.maxMessages$ > 0) {
        addBinaryData['server.maxMessages'] =
          ctx.matchedAction.pattern.maxMessages$
      }
      if (ctx.matchedAction.pattern.pubsub$ === true) {
        addBinaryData['server.pubsub'] = true
      }
    }

    Tracer.addBinary(meta, addBinaryData)

    const zkTrace = ctx[zipkinContextKey]

    hemera.log.debug(
      {
        zkTrace,
        meta
      },
      'sendServerSend'
    )

    Tracer.sendServerSend(zkTrace, meta)
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

    const addBinaryData = {
      'server.topic': ctx.trace$.service
    }
    if (ctx.matchedAction) {
      if (ctx.matchedAction.pattern.maxMessages$ > 0) {
        addBinaryData['server.maxMessages'] =
          ctx.matchedAction.pattern.maxMessages$
      }
      if (ctx.matchedAction.pattern.pubsub$ === true) {
        addBinaryData['server.pubsub'] = true
      }
    }
    Tracer.addBinary(meta, addBinaryData)

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      timestamp: ctx.trace$.timestamp,
      sampled: ctx.trace$.sampled
    }

    hemera.log.debug(
      {
        traceData,
        meta
      },
      'sendServerRecv'
    )

    ctx[zipkinContextKey] = Tracer.sendServerRecv(traceData, meta)
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

    const addBinaryData = {
      'rpc.topic': ctx.trace$.service,
      'rpc.method': ctx.trace$.method,
      'rpc.timeout': ctx.request.pattern.timeout$ || ctx.config.timeout
    }
    if (ctx.request.transport.maxMessages > 0) {
      addBinaryData['rpc.maxMessages'] = ctx.request.transport.maxMessages
    }
    if (ctx.request.transport.pubsub === true) {
      addBinaryData['rpc.pubsub'] = ctx.request.transport.pubsub
    }
    Tracer.addBinary(meta, addBinaryData)

    ctx.trace$.sampled = Tracer.shouldSample()

    let traceData = {
      traceId: ctx.trace$.traceId,
      parentSpanId: ctx.trace$.parentSpanId,
      spanId: ctx.trace$.spanId,
      sampled: ctx.trace$.sampled
    }

    hemera.log.debug(
      {
        traceData,
        meta
      },
      'sendClientSend'
    )

    ctx[zipkinContextKey] = Tracer.sendClientSend(traceData, meta)
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

    const zkTrace = ctx[zipkinContextKey]

    hemera.log.debug(
      {
        zkTrace,
        meta
      },
      'sendClientRecv'
    )

    Tracer.sendClientRecv(zkTrace, meta)
  })

  done()
}

const plugin = Hp(hemeraZipkin, {
  hemera: '>=5.8.0',
  scope: false,
  name: require('./package.json').name
})

module.exports = plugin
