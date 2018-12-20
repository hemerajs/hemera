'use strict'

const Hp = require('hemera-plugin')
const initTracer = require('jaeger-client').initTracer
const Opentracing = require('opentracing')

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

  hemera.ext('onRequest', (hemera, request, reply, next) => {
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

    hemera[jaegerContextKey] = span

    next()
  })

  hemera.ext('onSend', (hemera, request, reply, next) => {
    const span = hemera[jaegerContextKey]

    if (reply.error) {
      span.setTag(Opentracing.Tags.ERROR, true)
      span.log({
        event: 'error',
        'error.object': reply.error,
        message: reply.error.message,
        stack: reply.error.stack
      })
    }

    span.finish()

    next()
  })

  hemera.ext('onAct', (hemera, next) => {
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

    next()
  })

  hemera.ext('onActFinished', (hemera, next) => {
    hemera[jaegerContextKey].finish()
    next()
  })

  done()
}

module.exports = Hp(hemeraOpentracing, {
  hemera: '>=5.8.0',
  scoped: false,
  name: require('./package.json').name,
  options: {}
})
