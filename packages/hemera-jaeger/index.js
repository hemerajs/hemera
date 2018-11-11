'use strict'

const Hp = require('hemera-plugin')
const initTracer = require('jaeger-client').initTracer
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
  if (!opts.config.serviceName) {
    return done(new Error("The config property 'serviceName' is required"))
  }

  const jaegerContextKey = Symbol.for('jaeger.spanContext')
  hemera.decorate(jaegerContextKey, null)

  const contextKey = 'opentracing'
  const tracingKey = 'opentracing'
  const tracePrefix = 'Hemera'

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

  const tracer = initTracer(opts.config, opts.options)

  hemera.decorate('jaeger', {
    tracer
  })

  hemera.on('serverPreRequest', hemera => {
    let rootSpan = tracer.extract(
      Opentracing.FORMAT_TEXT_MAP,
      hemera.trace$[tracingKey]
    )

    let span = tracer.startSpan(`${tracePrefix} - ${hemera.trace$.method}`, {
      childOf: rootSpan
    })

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

    hemera[jaegerContextKey] = span
  })

  hemera.on('serverPreResponse', function(hemera) {
    const span = hemera[jaegerContextKey]

    addContextTags(span, hemera, 'delegate$', opts.delegateTags)

    span.finish()
  })

  hemera.on('clientPreRequest', hemera => {
    let span

    if (hemera[jaegerContextKey]) {
      span = tracer.startSpan(`${tracePrefix} - ${hemera.trace$.method}`, {
        childOf: hemera[jaegerContextKey]
      })
    } else if (hemera.context$[contextKey]) {
      span = tracer.startSpan(`${tracePrefix} - ${hemera.trace$.method}`, {
        childOf: hemera.context$[contextKey]
      })
    } else {
      span = tracer.startSpan(`${tracePrefix} - ${hemera.trace$.method}`)
    }

    // for cross process communication
    const textCarrier = {}
    tracer.inject(span, Opentracing.FORMAT_TEXT_MAP, textCarrier)
    hemera.trace$[tracingKey] = textCarrier

    span.setTag(Opentracing.Tags.PEER_SERVICE, 'hemera')
    span.setTag(tags.HEMERA_CONTEXT, 'client')
    span.setTag(tags.HEMERA_OP_TYPE, hemera.request$.type)
    span.setTag(tags.HEMERA_SERVICE, hemera.trace$.service)
    span.setTag(tags.HEMERA_PATTERN, hemera.trace$.method)

    if (hemera.request.transport.maxMessages > 0) {
      span.setTag(tags.HEMERA_ACT_MAXMSG, hemera.request.transport.maxMessages)
    }
    if (hemera.request.transport.expectedMessages$ > 0) {
      span.setTag(
        tags.HEMERA_ACT_EXPECTEDMSG,
        hemera.request.transport.expectedMessages$
      )
    }
    span.setTag(
      tags.HEMERA_ACT_TIMEOUT,
      hemera.request.pattern.timeout$ || hemera.config.timeout
    )

    hemera[jaegerContextKey] = span
  })

  hemera.on('clientPostRequest', hemera => {
    hemera[jaegerContextKey].finish()
  })

  hemera.on('serverResponseError', function(err) {
    let span = tracer.startSpan(
      `${tracePrefix} Event - serverResponseError - ${this.trace$.method}`,
      {
        childOf: this[jaegerContextKey].context()
      }
    )
    span.setTag(Opentracing.Tags.ERROR, true)
    span.log({
      event: 'error',
      'error.object': err,
      message: err.message,
      stack: err.stack
    })
    span.finish()
  })

  hemera.on('clientResponseError', function(err) {
    let span = tracer.startSpan(
      `${tracePrefix} Event - clientResponseError - ${this.trace$.method}`,
      {
        childOf: this[jaegerContextKey].context()
      }
    )
    span.setTag(Opentracing.Tags.ERROR, true)
    span.log({
      event: 'error',
      'error.object': err,
      message: err.message,
      stack: err.stack
    })
    span.finish()
  })

  done()
}

module.exports = Hp(hemeraOpentracing, {
  hemera: '>=5.8.0',
  scoped: false,
  name: require('./package.json').name,
  options: {
    delegateTags: []
  }
})
