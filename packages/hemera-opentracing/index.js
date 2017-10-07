'use strict'

const Hp = require('hemera-plugin')
const Jaeger = require('jaeger-client')
const UDPSender = require('jaeger-client/dist/src/reporters/udp_sender').default
const Opentracing = require('opentracing')

exports.plugin = Hp(hemeraOpentracing, '>=2.0.0')
exports.options = {
  name: require('./package.json').name,
  serviceName: 'my-service',
  jaeger: {
    maxTracesPerSecond: 1,
    options: {}
  }
}

function hemeraOpentracing(hemera, opts, done) {
  if (!opts.serviceName) {
    return done(new Error('serviceName is required'))
  }

  const sampler = new Jaeger.RateLimitingSampler(opts.jaeger.maxTracesPerSecond)
  const reporter = new Jaeger.RemoteReporter(new UDPSender())
  const tracer = new Jaeger.Tracer(opts.serviceName, reporter, sampler, opts)

  hemera.on('serverPreRequest', function(ctx) {
    const span = tracer.startSpan('serverRequest')
    span.log({ event: 'serverPreRequest' })
    span.setTag(Opentracing.Tags.PEER_SERVICE, ctx._topic)
    // span.setTag(Opentracing.Tags.SPAN_KIND_RPC_SERVER)
    // span.setTag(Opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER)
    ctx._jaegerServerTrace = span
  })

  hemera.on('serverPreResponse', function(ctx) {
    const childSpan = tracer.startSpan('serverRequest', {
      childOf: ctx._jaegerServerTrace
    })
    childSpan.log({ event: 'serverPreResponse' })
    childSpan.setTag(Opentracing.Tags.PEER_SERVICE, ctx._topic)
    // span.setTag(Opentracing.Tags.SPAN_KIND_RPC_SERVER)
    // span.setTag(Opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER)
    childSpan.finish()
    ctx._jaegerServerTrace.finish()
  })

  hemera.on('clientPreRequest', function(ctx) {
    const span = tracer.startSpan('clientRequest')
    span.log({ event: 'clientPreRequest' })
    // span.setTag(Opentracing.Tags.SPAN_KIND_RPC_CLIENT)
    // span.setTag(Opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER)
    ctx._jaegerTrace = span
  })

  hemera.on('clientPostRequest', function(ctx) {
    const childSpan = tracer.startSpan('clientRequest', {
      childOf: ctx._jaegerTrace
    })
    childSpan.log({ event: 'clientPostRequest' })
    // span.setTag(Opentracing.Tags.SPAN_KIND_RPC_CLIENT)
    // span.setTag(Opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER)
    childSpan.finish()
    ctx._jaegerTrace.finish()
  })

  done()
}
