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
    HEMERA_ACT_EXPECTEDMSG: 'hemera.act.expMsg',
    HEMERA_PUBSUB: 'hemera.pubsub',
    HEMERA_OP_TYPE: 'hemera.operationType',
    HEMERA_CONTEXT: 'hemera.context'
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

  hemera.decorate('jaeger', {
    tracer
  })

  hemera.on('serverPreRequest', function(hemera) {
    let wireCtx = tracer.extract(
      Opentracing.FORMAT_TEXT_MAP,
      hemera.trace$.opentracing
    )

    let span = tracer.startSpan(hemera.trace$.method, { childOf: wireCtx })

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_SERVICE, hemera.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, hemera.trace$.method)
    span.setTag(tags.HEMERA_CONTEXT, 'server')
    span.setTag(
      tags.HEMERA_PUBSUB,
      hemera.matchedAction
        ? hemera.matchedAction.pattern.pubsub$ || false
        : false
    )

    addContextTags(span, hemera, 'delegate$', opts.delegateTags)

    hemera.opentracing = span
  })

  hemera.on('serverPreResponse', function(ctx) {
    const span = ctx.opentracing

    addContextTags(span, ctx, 'delegate$', opts.delegateTags)

    span.finish()
  })

  hemera.on('clientPreRequest', function(hemera) {
    let span

    if (hemera.opentracing) {
      span = tracer.startSpan(hemera.trace$.method, {
        childOf: hemera.opentracing
      })
    } else if (hemera.context$.opentracing) {
      span = tracer.startSpan(hemera.trace$.method, {
        childOf: hemera.context$.opentracing
      })
    } else {
      span = tracer.startSpan(hemera.trace$.method)
    }

    // for cross process communication
    const textCarrier = {}
    tracer.inject(span, Opentracing.FORMAT_TEXT_MAP, textCarrier)
    hemera.trace$.opentracing = textCarrier

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_CONTEXT, 'client')
    span.setTag(tags.HEMERA_OP_TYPE, hemera.request$.type)
    span.setTag(tags.HEMERA_SERVICE, hemera.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, hemera.trace$.method)
    span.setTag(tags.HEMERA_ACT_MAXMSG, hemera._pattern.maxMessages$ || -1)
    span.setTag(
      tags.HEMERA_ACT_EXPECTEDMSG,
      hemera._pattern.exptectedMessages$ || -1
    )
    span.setTag(
      tags.HEMERA_ACT_TIMEOUT,
      hemera._pattern.timeout$ || hemera.config.timeout
    )

    hemera.opentracing = span
  })

  hemera.on('clientPostRequest', function(hemera) {
    hemera.opentracing.finish()
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

module.exports = Hp(hemeraOpentracing, {
  hemera: '^4.0.0',
  name: require('./package.json').name,
  dependencies: ['hemera-joi'],
  options: {
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
          'nodejs.version': process.versions.node
        }
      },
      reporter: {
        host: 'localhost'
      }
    }
  }
})
