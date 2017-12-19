'use strict'

const Hp = require('hemera-plugin')
const Jaeger = require('jaeger-client')
const UDPSender = require('jaeger-client/dist/src/reporters/udp_sender').default
const Opentracing = require('opentracing')

function addContextTags(span, ctx, key, tags) {
  tags.forEach(function(entry) {
    if (ctx[key][entry.key]) {
      span.setTag(entry.tag, ctx[key][entry.key])
    }
  })
}

/**
 * Hemera jaeger-opentracing plugin
 *
 * @param {any} hemera
 * @param {any} opts
 * @param {any} done
 * @returns
 */
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

  let sampler
  if (opts.jaeger.sampler.type === 'RateLimiting') {
    sampler = new Jaeger.RateLimitingSampler(opts.jaeger.sampler.options)
  } else if (opts.jaeger.sampler.type === 'Probabilistic') {
    sampler = new Jaeger.ProbabilisticSampler(opts.jaeger.sampler.options)
  } else if (opts.jaeger.sampler.type === 'GuaranteedThroughput') {
    sampler = new Jaeger.GuaranteedThroughputSampler(
      opts.jaeger.sampler.options.lowerBound,
      opts.jaeger.sampler.options.samplingRate
    )
  } else {
    sampler = new Jaeger.ConstSampler(opts.jaeger.sampler.options)
  }

  const reporter = new Jaeger.RemoteReporter(
    new UDPSender(opts.jaeger.reporter)
  )
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
    span.setTag(tags.HEMERA_SERVICE, ctx.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, ctx.trace$.method)
    span.setTag(
      tags.HEMERA_PUBSUB,
      ctx._actMeta ? ctx._actMeta.pattern.pubsub$ || false : false
    )

    addContextTags(span, ctx, 'delegate$', opts.delegateTags)

    ctx.opentracing = span
  })

  hemera.on('serverPreResponse', function(ctx) {
    const span = ctx.opentracing

    addContextTags(span, ctx, 'delegate$', opts.delegateTags)

    span.finish()
  })

  hemera.on('clientPreRequest', function(ctx) {
    let span

    if (ctx.opentracing) {
      span = tracer.startSpan('act', { childOf: ctx.opentracing })
    } else {
      span = tracer.startSpan('act')
    }

    // for cross process communication
    const textCarrier = {}
    tracer.inject(span, Opentracing.FORMAT_TEXT_MAP, textCarrier)
    ctx.trace$.opentracing = textCarrier

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_SERVICE, ctx.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, ctx.trace$.method)
    span.setTag(tags.HEMERA_ACT_MAXMSG, ctx._pattern.maxMessages$ || -1)
    span.setTag(tags.HEMERA_PUBSUB, ctx._pattern.pubsub$ || false)
    span.setTag(
      tags.HEMERA_ACT_TIMEOUT,
      ctx._pattern.timeout$ || ctx.config.timeout
    )

    ctx.opentracing = span
  })

  hemera.on('clientPostRequest', function(ctx) {
    ctx.opentracing.finish()
  })

  hemera.on('serverResponseError', function(err) {
    this.opentracing.log({
      event: 'error',
      'error.object': err,
      message: err.message,
      stack: err.stack
    })
  })

  hemera.on('clientResponseError', function(err) {
    this.opentracing.log({
      event: 'error',
      'error.object': err,
      message: err.message,
      stack: err.stack
    })
  })

  done()
}

const plugin = Hp(hemeraOpentracing, '>=2.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  delegateTags: [
    {
      key: 'query',
      tag: 'hemera.db.query'
    }
  ],
  jaeger: {
    sampler: {
      type: 'Const',
      options: true
    },
    options: {
      tags: {
        'hemera.version': 'Node-' + require('nats-hemera/package.json').version,
        'nodejs.version': process.versions.node
      }
    },
    reporter: {
      host: 'localhost'
    }
  }
}
module.exports = plugin
