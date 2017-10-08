'use strict'

const Hp = require('hemera-plugin')
const Jaeger = require('jaeger-client')
const UDPSender = require('jaeger-client/dist/src/reporters/udp_sender').default
const Opentracing = require('opentracing')

exports.plugin = Hp(hemeraOpentracing, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  delegateTags: [
    {
      key: 'query',
      tag: 'hemera.db.query'
    }
  ],
  jaeger: {
    options: {
      tags: {}
    }
  }
}

function addContextTags(span, ctx, key, tags) {
  tags.forEach(function(entry) {
    if (ctx[key][entry.key]) {
      span.setTag(entry.tag, ctx[key][entry.key])
    }
  })
}

function hemeraOpentracing(hemera, opts, done) {
  if (!opts.serviceName) {
    return done(new Error('serviceName is required'))
  }

  const tags = {
    HEMERA_PATTERN: 'hemera.pattern',
    HEMERA_SERVICE: 'hemera.service',
    HEMERA_ACT_TIMEOUT: 'hemera.act.timeout',
    HEMERA_ACT_MAXMSG: 'hemera.act.maxMsg',
    HEMERA_PUBSUB: 'hemera.pubsub'
  }
  const sampler = new Jaeger.ConstSampler(true)
  const reporter = new Jaeger.RemoteReporter(new UDPSender())
  const tracer = new Jaeger.Tracer(
    opts.serviceName,
    reporter,
    sampler,
    opts.jaeger.options
  )

  hemera.on('serverPreRequest', function(ctx) {
    let wireCtx = tracer.extract(
      Opentracing.FORMAT_TEXT_MAP,
      ctx.trace$.opentracing
    )

    let span = tracer.startSpan('add', { childOf: wireCtx })

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_SERVICE, ctx._topic)
    span.setTag(tags.HEMERA_PATTERN, ctx.trace$.method)
    span.setTag(
      tags.HEMERA_PUBSUB,
      ctx._actMeta ? ctx._actMeta.pattern.pubsub$ || false : false
    )

    addContextTags(span, ctx, 'delegate$', opts.delegateTags)

    ctx._opentracing = span
  })

  hemera.on('serverPreResponse', function(ctx) {
    const span = ctx._opentracing

    addContextTags(span, ctx, 'delegate$', opts.delegateTags)

    span.finish()
  })

  hemera.on('clientPreRequest', function(ctx) {
    let span

    if (ctx._opentracing) {
      span = tracer.startSpan('act', { childOf: ctx._opentracing })
      const textCarrier = {}
      tracer.inject(span, Opentracing.FORMAT_TEXT_MAP, textCarrier)
      // for cross process communication
      ctx.trace$.opentracing = textCarrier
    } else {
      span = tracer.startSpan('act')
      const textCarrier = {}
      tracer.inject(span, Opentracing.FORMAT_TEXT_MAP, textCarrier)
      // for cross process communication
      ctx.trace$.opentracing = textCarrier
    }

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_SERVICE, ctx.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, ctx.trace$.method)
    span.setTag(tags.HEMERA_ACT_MAXMSG, ctx._pattern.maxMessages$ || -1)
    span.setTag(tags.HEMERA_PUBSUB, ctx._pattern.pubsub$ || false)
    span.setTag(
      tags.HEMERA_ACT_TIMEOUT,
      ctx._pattern.timeout$ || ctx.config.timeout
    )

    ctx._opentracing = span
  })

  hemera.on('clientPostRequest', function(ctx) {
    ctx._opentracing.finish()
  })

  done()
}
